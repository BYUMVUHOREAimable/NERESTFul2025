
const prisma = require("../config/database");
const { generateParkingTicketPdf } = require("../utils/pdfGenerator");
const {
  SlotRequestStatus,
  ParkingSlotStatus,
  RoleName,
  Prisma,
} = require("@prisma/client");
const { sendEmail } = require("../config/email");
const { renderEmailTemplate } = require("../utils/renderEmailTemplate");

const createSlotRequest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { vehicle_id, parking_slot_id, expected_duration_hours } = req.body;

   
    if (!vehicle_id || !parking_slot_id || !expected_duration_hours) {
      return res.status(400).json({
        message:
          "Vehicle ID, Parking Slot ID, and Expected Duration are required.",
      });
    }
    const duration = parseInt(expected_duration_hours, 10);
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({
        message: "Expected duration must be a positive number of hours.",
      });
    }

    
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found."); 

      const vehicle = await tx.vehicle.findFirst({
        where: { id: vehicle_id, user_id: userId },
      });
      if (!vehicle)
        throw new Error("Vehicle not found or does not belong to you.");

      const parkingSlot = await tx.parkingSlot.findUnique({
        where: { id: parking_slot_id },
      });
      if (!parkingSlot) throw new Error("Selected parking slot not found.");
      if (parkingSlot.status !== ParkingSlotStatus.AVAILABLE) {
        throw new Error(
          `Slot ${parkingSlot.slot_number} is no longer available.`
        );
      }
      if (!parkingSlot.cost_per_hour) {
        throw new Error(
          `Slot ${parkingSlot.slot_number} does not have a defined cost. Cannot request.`
        );
      }

     
      const costPerHour = new Prisma.Decimal(parkingSlot.cost_per_hour);
      const calculatedCost = costPerHour.mul(new Prisma.Decimal(duration));

      
      if (new Prisma.Decimal(user.balance).lt(calculatedCost)) {
        
        const balanceError = new Error(
          `Insufficient balance. Required: $${calculatedCost.toFixed(
            2
          )}, Available: $${user.balance.toFixed(
            2
          )}. Please top up your account.`
        );
        balanceError.statusCode = 402; 
        throw balanceError;
      }

     
      const existingActiveRequest = await tx.slotRequest.findFirst({
        where: {
          vehicle_id: vehicle.id,
          status: {
            in: [SlotRequestStatus.PENDING, SlotRequestStatus.APPROVED],
          },
        },
      });
      if (existingActiveRequest) {
        throw new Error(
          `You already have an active request (Status: ${existingActiveRequest.status}). Please resolve it before making a new one.`
        );
      }

      const newRequest = await tx.slotRequest.create({
        data: {
          user_id: userId,
          vehicle_id: vehicle.id,
          parking_slot_id: parkingSlot.id, 
          expected_duration_hours: duration,
          calculated_cost: calculatedCost,
          status: SlotRequestStatus.PENDING,
        },
        include: { vehicle: true, parking_slot: true },
      });
      return { newRequest, vehicle, parkingSlot };
    });



    res.status(201).json({
      message: "Slot request submitted successfully and is pending approval.",
      request: result.newRequest,
    });
  } catch (error) {
    console.error("Create slot request error:", error);
    if (error.statusCode === 402) {
      return res.status(402).json({ message: error.message });
    }
   
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("parking_slot_id")
    ) {
      return res.status(400).json({
        message:
          "This parking slot was just requested by someone else. Please try another.",
      });
    }
    res
      .status(500)
      .json({ message: error.message || "Server error creating slot request" });
  }
};


const listSlotRequests = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const isAdmin = req.user.role_name === RoleName.ADMIN;

    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "created_at",
      order = "desc",
      status, 
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (!isAdmin) {
      where.user_id = userId;
    }

    if (
      status &&
      Object.values(SlotRequestStatus).includes(status.toUpperCase())
    ) {
      where.status = status.toUpperCase();
    }

    if (search) {
      const searchCondition = { contains: search, mode: "insensitive" };
      if (isAdmin) {
        where.OR = [
          { vehicle: { plate_number: searchCondition } },
          { user: { name: searchCondition } },
          { user: { email: searchCondition } },
        ];
      } else {
       
        where.vehicle = { plate_number: searchCondition };
      }
    }

    const orderByOptions = {};
    if (
      ["status", "requested_at", "resolved_at", "created_at"].includes(sortBy)
    ) {
      orderByOptions[sortBy] = order.toLowerCase() === "asc" ? "asc" : "desc";
    } else if (sortBy === "vehicle_plate") {
      orderByOptions.vehicle = {
        plate_number: order.toLowerCase() === "asc" ? "asc" : "desc",
      };
    } else if (isAdmin && sortBy === "user_name") {
      orderByOptions.user = {
        name: order.toLowerCase() === "asc" ? "asc" : "desc",
      };
    } else {
      orderByOptions.created_at = "desc";
    }

    const requests = await prisma.slotRequest.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: orderByOptions,
      include: {
        user: { select: { id: true, name: true, email: true } },
        vehicle: {
          select: {
            id: true,
            plate_number: true,
            vehicle_type: true,
            size: true,
          },
        },
        parking_slot: {
          select: { id: true, slot_number: true, location: true },
        },
      },
    });

    const totalRequests = await prisma.slotRequest.count({ where });

    res.status(200).json({
      data: requests,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRequests / limitNum),
        totalItems: totalRequests,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("List slot requests error:", error);
    res.status(500).json({ message: "Server error retrieving slot requests" });
  }
};


const updateMySlotRequest = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const requestId = req.params.id;
    const { vehicle_id, status } = req.body; 

    if (isNaN(requestId)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const requestToUpdate = await prisma.slotRequest.findUnique({
      where: { id: requestId },
    });

    if (!requestToUpdate) {
      return res.status(404).json({ message: "Slot request not found." });
    }
    if (requestToUpdate.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only update your own requests." });
    }
    if (requestToUpdate.status !== SlotRequestStatus.PENDING) {
      return res.status(400).json({
        message: `Cannot update request. Status is already ${requestToUpdate.status}.`,
      });
    }

    const updateData = {};
    if (vehicle_id) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicle_id, user_id: userId },
      });
      if (!vehicle) {
        return res.status(404).json({
          message: "New vehicle not found or does not belong to you.",
        });
      }
      updateData.vehicle_id = vehicle.id;
    }
    if (status) {
      if (status.toUpperCase() === SlotRequestStatus.CANCELLED) {
        updateData.status = SlotRequestStatus.CANCELLED;
        updateData.resolved_at = new Date(); 
      } else {
        return res.status(400).json({
          message:
            "Invalid status update. Users can only cancel pending requests.",
        });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided." });
    }

    const updatedRequest = await prisma.slotRequest.update({
      where: { id: requestId },
      data: updateData,
      include: { vehicle: true },
    });

    res.status(200).json({
      message: "Slot request updated successfully.",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Update my slot request error:", error);
    res.status(500).json({ message: "Server error updating slot request" });
  }
};


const resolveSlotRequest = async (req, res) => {
  try {
    const adminUserId = req.user.user_id;
    const requestId = req.params.id;
    const { status, admin_notes } = req.body;

    if (!status || ![SlotRequestStatus.APPROVED, SlotRequestStatus.REJECTED].includes(status.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid status. Must be APPROVED or REJECTED.' });
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const requestToResolve = await tx.slotRequest.findUnique({
        where: { id: requestId },
        include: {
          user: { select: { id: true, name: true, email: true, balance: true } },
          vehicle: true,
          parking_slot: true,
        },
      });

      if (!requestToResolve) throw new Error('Slot request not found.');
      if (requestToResolve.status !== SlotRequestStatus.PENDING) {
        throw new Error(`Request already resolved with status: ${requestToResolve.status}.`);
      }
      if (!requestToResolve.parking_slot) { 
        if (status.toUpperCase() === SlotRequestStatus.APPROVED) {
          
          throw new Error('Cannot approve: No parking slot was associated with this request during creation.');
        }
      }


      const updateDataForRequest = {
        status: status.toUpperCase(),
        admin_notes: admin_notes || null,
        resolved_at: new Date(),
      };

      if (status.toUpperCase() === SlotRequestStatus.APPROVED) {
        if (!requestToResolve.calculated_cost) throw new Error("Calculated cost missing. Cannot approve.");
        if (!requestToResolve.parking_slot_id) throw new Error("Parking slot ID missing from request. Cannot approve.");

        const costToDeduct = new Prisma.Decimal(requestToResolve.calculated_cost);
        const currentUserBalance = new Prisma.Decimal(requestToResolve.user.balance);

        if (currentUserBalance.lt(costToDeduct)) {
          const balanceError = new Error(`Cannot approve: User's balance ($${currentUserBalance.toFixed(2)}) is less than cost ($${costToDeduct.toFixed(2)}).`);
          balanceError.statusCode = 400;
          throw balanceError;
        }

        await tx.user.update({
          where: { id: requestToResolve.user_id },
          data: { balance: currentUserBalance.sub(costToDeduct) },
        });
        await tx.parkingSlot.update({
          where: { id: requestToResolve.parking_slot_id }, 
          data: { status: ParkingSlotStatus.UNAVAILABLE },
        });
      } else if (status.toUpperCase() === SlotRequestStatus.REJECTED) {
       
      }


      return tx.slotRequest.update({
        where: { id: requestId },
        data: updateDataForRequest,
        include: { user: true, vehicle: true, parking_slot: true }, 
      });
    });


    if (updatedRequest.status === SlotRequestStatus.APPROVED && updatedRequest.parking_slot) {
     

      const ticketDownloadLink = `${process.env.FRONTEND_URL}/view-ticket?requestId=${updatedRequest.id}`;

      
      const emailData = {
        userName: updatedRequest.user.name,
        vehiclePlateNumber: updatedRequest.vehicle.plate_number,
        vehicleType: updatedRequest.vehicle.vehicle_type, 
        slotNumber: updatedRequest.parking_slot.slot_number,
        slotLocation: updatedRequest.parking_slot.location || 'N/A',
        slotSize: updatedRequest.parking_slot.size,                
        approvalDate: updatedRequest.resolved_at ? new Date(updatedRequest.resolved_at).toLocaleDateString() : 'N/A',
        totalCost: updatedRequest.calculated_cost.toFixed(2),
        expectedDuration: updatedRequest.expected_duration_hours, 
        ticketLink: ticketDownloadLink,
        
      };

      const htmlEmail = renderEmailTemplate('slotApprovalEmail', emailData);

      if (htmlEmail) {
        await sendEmail(
          updatedRequest.user.email,
          'XYZ LTD PMS: Your Parking Slot Request Approved!', 
          `Dear ${emailData.userName},\n\nYour parking request for vehicle ${emailData.vehiclePlateNumber} has been approved.\nSlot: ${emailData.slotNumber}\nDuration: ${emailData.expectedDuration} hours\nCost: $${emailData.totalCost} (deducted from balance).\nDownload Ticket: ${emailData.ticketLink}\n\nThank you,\nThe XYZ LTD PMS Team`,
          htmlEmail
        );
      } else {
        console.error("Failed to render slot approval email template for request ID:", updatedRequest.id);
        
      }
    }
    
    res.status(200).json({ message: `Slot request ${updatedRequest.status.toLowerCase()} successfully.`, request: updatedRequest });
  } catch (error) {
    console.error('Resolve slot request error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || 'Server error resolving slot request' });
  }
};



const downloadTicketPdf = async (req, res) => {
  try {
    const requestId = req.params.id;
    const requestingUserId = req.user.user_id;
    const isAdmin = req.user.role_name === RoleName.ADMIN;

    const slotRequest = await prisma.slotRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        vehicle: true,
        parking_slot: true,
      },
    });

    if (!slotRequest) {
      return res.status(404).json({ message: 'Slot request not found.' });
    }

    
    if (slotRequest.user_id !== requestingUserId && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to download this ticket.' });
    }

    if (slotRequest.status !== SlotRequestStatus.APPROVED || !slotRequest.parking_slot) {
      return res.status(400).json({ message: 'Ticket can only be generated for approved and assigned requests.' });
    }

    const ticketData = {
      user: slotRequest.user,
      vehicle: slotRequest.vehicle,
      parkingSlot: slotRequest.parking_slot,
      slotRequest: {
        id: slotRequest.id,
        expected_duration_hours: slotRequest.expected_duration_hours,
        calculated_cost: slotRequest.calculated_cost,
        requested_at: slotRequest.requested_at,
        resolved_at: slotRequest.resolved_at,
      },
      appName: "XYZ LTD PMS Systems" 
    };

    const pdfBuffer = await generateParkingTicketPdf(ticketData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="parking-ticket-${slotRequest.id.substring(0, 8)}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Download ticket PDF error:', error);
    res.status(500).json({ message: 'Failed to generate or download ticket PDF.' });
  }
};

module.exports = {
  createSlotRequest,
  listSlotRequests,
  updateMySlotRequest, 
  resolveSlotRequest,
  downloadTicketPdf,
};
