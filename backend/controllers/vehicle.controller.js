// controllers/vehicle.controller.js
const prisma = require("../config/database");

const { VehicleType, VehicleSize } = require("@prisma/client"); // For validating enum values

/**
 * (User) Add a new vehicle to the authenticated user's account.
 */
const addVehicle = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { plate_number, vehicle_type, size, other_attributes } = req.body;

    // --- Validation ---
    if (!plate_number || !vehicle_type || !size) {
      return res.status(400).json({
        message: "Plate number, vehicle type, and size are required.",
      });
    }

    // Validate plate_number format (example: basic alphanumeric, can be more specific)
    if (!/^[A-Z0-9-]{3,15}$/i.test(plate_number)) {
      return res.status(400).json({
        message:
          "Invalid plate number format. Use A-Z, 0-9, hyphens, 3-15 chars.",
      });
    }

    // Validate against Enum values
    if (!Object.values(VehicleType).includes(vehicle_type.toUpperCase())) {
      return res.status(400).json({
        message: `Invalid vehicle_type. Valid types are: ${Object.values(
          VehicleType
        ).join(", ")}`,
      });
    }
    if (!Object.values(VehicleSize).includes(size.toUpperCase())) {
      return res.status(400).json({
        message: `Invalid size. Valid sizes are: ${Object.values(
          VehicleSize
        ).join(", ")}`,
      });
    }

    // Check for uniqueness of plate_number
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plate_number: plate_number.toUpperCase() }, // Store plate numbers consistently (e.g., uppercase)
    });
    if (existingVehicle) {
      return res
        .status(400)
        .json({ message: "Plate number already registered." });
    }

    const newVehicle = await prisma.vehicle.create({
      data: {
        user_id: userId,
        plate_number: plate_number.toUpperCase(),
        vehicle_type: vehicle_type.toUpperCase(),
        size: size.toUpperCase(),
        other_attributes: other_attributes || null, // Optional field
      },
    });


    res
      .status(201)
      .json({ message: "Vehicle added successfully", vehicle: newVehicle });
  } catch (error) {
    console.error("Add vehicle error:", error);
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("plate_number")
    ) {
      return res.status(400).json({
        message: "Plate number already registered (concurrent request).",
      });
    }
    res.status(500).json({ message: "Server error adding vehicle" });
  }
};

/**
 * (User) List all vehicles belonging to the authenticated user.
 * Supports pagination and search by plate number or vehicle type.
 */

const listMyVehicles = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "created_at",
      order = "desc",
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = { user_id: userId };

    if (search) {
      const orConditions = [];
      orConditions.push({
        plate_number: { contains: search, mode: "insensitive" },
      });

      // Check if the search term is a valid VehicleType enum member (case-insensitive)
      const searchUpper = search.toUpperCase();
      let isValidVehicleType = false;
      for (const typeKey in VehicleType) {
        if (VehicleType[typeKey] === searchUpper) {
          isValidVehicleType = true;
          break;
        }
      }

      if (isValidVehicleType) {
        // If it's a valid enum member string, use it directly with `equals`.
        // Prisma expects the string value of the enum member here.
        orConditions.push({ vehicle_type: { equals: searchUpper } });
      }
      // If you wanted to search by size as well, you'd add similar logic for VehicleSize:
      // let isValidVehicleSize = false;
      // for (const sizeKey in VehicleSize) {
      //   if (VehicleSize[sizeKey] === searchUpper) {
      //     isValidVehicleSize = true;
      //     break;
      //   }
      // }
      // if (isValidVehicleSize) {
      //   orConditions.push({ size: { equals: searchUpper } });
      // }

      if (orConditions.length > 0) {
        where.OR = orConditions;
      }
    }

    const orderByOptions = {};
    if (
      ["plate_number", "vehicle_type", "size", "created_at"].includes(sortBy)
    ) {
      orderByOptions[sortBy] = order.toLowerCase() === "asc" ? "asc" : "desc";
    } else {
      orderByOptions.created_at = "desc";
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: orderByOptions,
    });

    const totalVehicles = await prisma.vehicle.count({ where });

    res.status(200).json({
      data: vehicles,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalVehicles / limitNum),
        totalItems: totalVehicles,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("List my vehicles error:", error);
    res.status(500).json({ message: "Server error retrieving vehicles" });
  }
};
/**
 * (User) Get details of a specific vehicle owned by the authenticated user.
 */
const getMyVehicleById = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const vehicleId = req.params.id;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found." });
    }
    if (vehicle.user_id !== userId) {
      // User is trying to access a vehicle that isn't theirs
      return res
        .status(403)
        .json({ message: "Forbidden: You do not own this vehicle." });
    }

    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Get my vehicle by ID error:", error);
    res.status(500).json({ message: "Server error retrieving vehicle" });
  }
};

/**
 * (User) Update details of a specific vehicle owned by the authenticated user.
 */
const updateMyVehicle = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const vehicleId = req.params.id;
    const { plate_number, vehicle_type, size, other_attributes } = req.body;

    const vehicleToUpdate = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicleToUpdate) {
      return res.status(404).json({ message: "Vehicle not found." });
    }
    if (vehicleToUpdate.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not own this vehicle." });
    }

    const updateData = {};
    if (plate_number) {
      if (!/^[A-Z0-9-]{3,15}$/i.test(plate_number)) {
        return res
          .status(400)
          .json({ message: "Invalid plate number format." });
      }
      const newPlate = plate_number.toUpperCase();
      if (newPlate !== vehicleToUpdate.plate_number) {
        const existingVehicle = await prisma.vehicle.findFirst({
          where: { plate_number: newPlate, NOT: { id: vehicleId } },
        });
        if (existingVehicle) {
          return res.status(400).json({
            message:
              "New plate number is already registered to another vehicle.",
          });
        }
        updateData.plate_number = newPlate;
      }
    }
    if (vehicle_type) {
      if (!Object.values(VehicleType).includes(vehicle_type.toUpperCase())) {
        return res.status(400).json({
          message: `Invalid vehicle_type. Valid types are: ${Object.values(
            VehicleType
          ).join(", ")}`,
        });
      }
      updateData.vehicle_type = vehicle_type.toUpperCase();
    }
    if (size) {
      if (!Object.values(VehicleSize).includes(size.toUpperCase())) {
        return res.status(400).json({
          message: `Invalid size. Valid sizes are: ${Object.values(
            VehicleSize
          ).join(", ")}`,
        });
      }
      updateData.size = size.toUpperCase();
    }
    if (other_attributes !== undefined) {
      // Allow setting to null or providing new JSON
      updateData.other_attributes = other_attributes;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided." });
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: updateData,
    });



    res.status(200).json({
      message: "Vehicle updated successfully",
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error("Update my vehicle error:", error);
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("plate_number")
    ) {
      return res.status(400).json({
        message: "New plate number is already registered (concurrent request).",
      });
    }
    res.status(500).json({ message: "Server error updating vehicle" });
  }
};

/**
 * (User) Delete a specific vehicle owned by the authenticated user.
 */
const deleteMyVehicle = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const vehicleId = req.params.id;

    // if (isNaN(vehicleId)) {
    //   return res.status(400).json({ message: "Invalid vehicle ID format." });
    // }

    const vehicleToDelete = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicleToDelete) {
      return res.status(404).json({ message: "Vehicle not found." });
    }
    if (vehicleToDelete.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not own this vehicle." });
    }

    // Check if vehicle has active slot requests before deleting (optional, business logic dependent)
    const activeRequests = await prisma.slotRequest.count({
      where: {
        vehicle_id: vehicleId,
        status: { in: ["PENDING", "APPROVED"] }, // Or just PENDING if approved slots are tied to the slot
      },
    });
    if (activeRequests > 0) {
      return res.status(400).json({
        message:
          "Cannot delete vehicle with active or approved parking requests. Please cancel them first.",
      });
    }

    await prisma.vehicle.delete({
      where: { id: vehicleId },
    });

    res.status(200).json({ message: "Vehicle deleted successfully." });
  } catch (error) {
    console.error("Delete my vehicle error:", error);
    if (error.code === "P2025") {
      // Record to delete not found
      return res.status(404).json({ message: "Vehicle not found to delete." });
    }
    res.status(500).json({ message: "Server error deleting vehicle" });
  }
};

module.exports = {
  addVehicle,
  listMyVehicles,
  getMyVehicleById,
  updateMyVehicle,
  deleteMyVehicle,
};
