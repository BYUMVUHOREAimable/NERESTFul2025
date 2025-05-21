// controllers/vehicleEntry.controller.js
const prisma = require('../config/database');
const { Prisma, ParkingSlotStatus, VehicleEntryStatus, RoleName } = require('@prisma/client');
const { generateEntryTicketPdf, generateExitBillPdf } = require('../utils/pdfGenerator');
const { v4: uuidv4 } = require('uuid'); // For generating unique ticket numbers if not using entry ID

// Helper function to generate unique ticket numbers (example)
const generateTicketNumber = () => {
    // Simple example: timestamp + random part. Make it more robust for production.
    return `TKT-${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
};

/**
 * (Attendant/Admin) Record a new vehicle entry.
 */
const recordVehicleEntry = async (req, res) => {
    const attendantUserId = req.user.user_id; // From JWT
    const attendantName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'System'; // For PDF

    try {
        const { plate_number, parking_id } = req.body; // parking_id is the UUID of the Parking facility

        // --- Validation ---
        if (!plate_number || !parking_id) {
            return res.status(400).json({ message: 'Plate number and parking facility ID are required.' });
        }
        if (!/^[A-Z0-9-]{3,15}$/i.test(plate_number)) { // Basic plate validation
            return res.status(400).json({ message: 'Invalid plate number format.' });
        }
        // --- End Validation ---

        const result = await prisma.$transaction(async (tx) => {
            const parkingFacility = await tx.parking.findUnique({
                where: { id: parking_id }
            });

            if (!parkingFacility) {
                throw { statusCode: 404, message: 'Selected parking facility not found.' };
            }

            if (parkingFacility.occupied_spaces >= parkingFacility.total_spaces) {
                throw { statusCode: 400, message: `Parking facility '${parkingFacility.name}' is full.` };
            }

            // Check for existing PARKED entry for this plate number (optional, business rule)
            const existingParkedEntry = await tx.vehicleEntry.findFirst({
                where: { plate_number: plate_number.toUpperCase(), status: VehicleEntryStatus.PARKED }
            });
            if (existingParkedEntry) {
                throw { statusCode: 400, message: `Vehicle with plate ${plate_number.toUpperCase()} is already marked as PARKED.` };
            }


            const newEntry = await tx.vehicleEntry.create({
                data: {
                    plate_number: plate_number.toUpperCase(),
                    parking_id: parkingFacility.id,
                    entry_time: new Date(),
                    status: VehicleEntryStatus.PARKED,
                    ticket_number: generateTicketNumber(), // Generate a unique ticket number
                    recorded_by_id: attendantUserId,
                    charged_amount: new Prisma.Decimal(0.00),
                }
            });

            // Atomically increment occupied spaces
            const updatedParking = await tx.parking.update({
                where: { id: parkingFacility.id },
                data: { occupied_spaces: { increment: 1 } }
            });

            return { newEntry, parkingFacility, updatedParking };
        });

        // Prepare data for PDF ticket (outside transaction)
        const entryTicketData = {
            plate_number: result.newEntry.plate_number,
            ticket_number: result.newEntry.ticket_number,
            entry_time: result.newEntry.entry_time,
            parking: {
                name: result.parkingFacility.name,
                code: result.parkingFacility.code,
                location: result.parkingFacility.location
            },
            attendantName: attendantName,
            appName: "ParkWell Systems"
        };

        // Generate PDF ticket (can be done after response for speed, or before)
        // For now, we'll just return a link to a download endpoint
        const ticketDownloadUrl =
            `${process.env.BACKEND_URL || req.protocol + '://' + req.get('host')}/api/v1/vehicle-entries/${result.newEntry.id}/entry-ticket`;


        // Log action if logging is enabled
        // await logAction({ userId: attendantUserId, action: `Recorded entry for ${result.newEntry.plate_number} at ${result.parkingFacility.name}`, entityType: 'VehicleEntry', entityId: result.newEntry.id });

        res.status(201).json({
            message: `Vehicle ${result.newEntry.plate_number} entered successfully. Occupied spaces in ${result.updatedParking.name}: ${result.updatedParking.occupied_spaces}/${result.updatedParking.total_spaces}.`,
            vehicleEntry: result.newEntry,
            ticketDownloadUrl: ticketDownloadUrl
        });

    } catch (error) {
        console.error('Record vehicle entry error:', error);
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error recording vehicle entry.';
        if (error.code === 'P2002' && error.meta?.target?.includes('ticket_number')) {
            return res.status(400).json({ message: 'Ticket number generation conflict. Please try again.' })
        }
        res.status(statusCode).json({ message });
    }
};


/**
 * (Attendant/Admin) Download the entry ticket PDF for a vehicle entry.
 */
const downloadEntryTicket = async (req, res) => {
    const entryId = req.params.entryId;
    console.log(`[Public TicketDownload] Attempting for entry ID: ${entryId}`);

    try {
        const vehicleEntry = await prisma.vehicleEntry.findUnique({
            where: { id: entryId },
            include: {
                parking: true, // Need parking details for the ticket
                recorded_by: { // Optional: fetch who recorded it, if you want to display on ticket
                    select: { firstName: true, lastName: true }
                }
            }
        });

        if (!vehicleEntry) {
            console.error(`[Public TicketDownload] Vehicle entry record not found for ID: ${entryId}`);
            return res.status(404).json({ message: "Vehicle entry record not found." });
        }

        // No JWT-based authorization check as req.user is not available for public route.
        // Access is granted if the entryId is valid and found.

        // Determine attendant name for the ticket
        let attendantNameOnTicket = 'System'; // Default if no attendant linked or we don't want to show
        if (vehicleEntry.recorded_by) {
            attendantNameOnTicket = `${vehicleEntry.recorded_by.firstName || ''} ${vehicleEntry.recorded_by.lastName || ''}`.trim();
        }


        const ticketData = {
            plate_number: vehicleEntry.plate_number,
            ticket_number: vehicleEntry.ticket_number,
            entry_time: vehicleEntry.entry_time,
            parking: {
                name: vehicleEntry.parking.name,
                code: vehicleEntry.parking.code,
                location: vehicleEntry.parking.location
            },
            attendantName: attendantNameOnTicket, // Use fetched or default name
            appName: "ParkWell Systems"
        };
        console.log(`[Public TicketDownload] Data for PDF:`, JSON.stringify(ticketData, null, 2));


        const pdfBuffer = await generateEntryTicketPdf(ticketData);
        console.log(`[Public TicketDownload] PDF buffer generated for ${entryId}. Length: ${pdfBuffer.length}`);


        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="entry-ticket-${vehicleEntry.ticket_number}.pdf"`);
        console.log(`[Public TicketDownload] Sending PDF for ${entryId}.`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('[Public TicketDownload] Critical error:', error);
        res.status(500).json({ message: "Failed to generate or download entry ticket." });
    }
};

const recordVehicleExit = async (req, res) => {
    const attendantUserId = req.user.user_id; // User ID from JWT (the one performing the exit)
    // const attendantName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'System'; // This is correct for who is *currently* acting
    const { vehicleEntryId } = req.params;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const vehicleEntry = await tx.vehicleEntry.findUnique({
                where: { id: vehicleEntryId },
                include: {
                    parking: true, // Need parking for charge_per_hour
                    // We don't necessarily need to include recorded_by here for calculations,
                    // but we will include it in the final update's include for the response.
                }
            });

            if (!vehicleEntry) {
                throw { statusCode: 404, message: 'Active vehicle entry not found.' };
            }
            if (vehicleEntry.status !== VehicleEntryStatus.PARKED) {
                throw { statusCode: 400, message: `Vehicle is not currently PARKED. Status: ${vehicleEntry.status}` };
            }
            if (!vehicleEntry.parking || vehicleEntry.parking.charge_per_hour === null) {
                throw { statusCode: 500, message: 'Parking facility details or charge rate missing for this entry.' };
            }

            const exitTime = new Date();
            const entryTime = new Date(vehicleEntry.entry_time);
            const durationMillis = exitTime.getTime() - entryTime.getTime();
            const durationMinutes = Math.max(1, Math.ceil(durationMillis / (1000 * 60)));

            const billedHours = Math.max(1, Math.ceil(durationMinutes / 60.0));

            const chargePerHour = new Prisma.Decimal(vehicleEntry.parking.charge_per_hour);
            const calculatedCharge = chargePerHour.mul(new Prisma.Decimal(billedHours));

            const updatedVehicleEntry = await tx.vehicleEntry.update({
                where: { id: vehicleEntryId },
                data: {
                    exit_time: exitTime,
                    status: VehicleEntryStatus.EXITED,
                    calculated_duration_minutes: durationMinutes,
                    charged_amount: calculatedCharge,
                    recorded_by_id: attendantUserId, // Update/confirm who recorded the exit action
                },
                include: { // Data to return in the API response and for the bill
                    parking: true,
                    recorded_by: { // <<< CORRECTED RELATION NAME
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            const updatedParking = await tx.parking.update({
                where: { id: vehicleEntry.parking_id },
                data: { occupied_spaces: { decrement: 1 } }
            });
            if (updatedParking.occupied_spaces < 0) {
                await tx.parking.update({ where: { id: vehicleEntry.parking_id }, data: { occupied_spaces: 0 } });
                console.warn(`Corrected occupied_spaces for parking ${updatedParking.id} to 0.`);
            }

            // The `userRecordedBy` for the PDF should be the person who *performed the exit* action,
            // which is the currently logged-in user from req.user.
            return {
                updatedVehicleEntry,
                updatedParking,
                userWhoPerformedExit: { // For clarity in PDF generation
                    firstName: req.user.firstName,
                    lastName: req.user.lastName
                }
            };
        });

        const billDownloadUrl =
            `${process.env.BACKEND_URL || req.protocol + '://' + req.get('host')}/api/v1/vehicle-entries/${result.updatedVehicleEntry.id}/exit-bill`;


        res.status(200).json({
            message: `Vehicle ${result.updatedVehicleEntry.plate_number} exited. Amount charged: $${result.updatedVehicleEntry.charged_amount.toFixed(2)}.`,
            vehicleEntry: result.updatedVehicleEntry, // This will have the included recorded_by details
            billDownloadUrl: billDownloadUrl,
            parkingStatus: `Occupied spaces in ${result.updatedParking.name}: ${result.updatedParking.occupied_spaces}/${result.updatedParking.total_spaces}`
        });

    } catch (error) {
        console.error('Record vehicle exit error:', error);
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Server error recording vehicle exit.';
        res.status(statusCode).json({ message });
    }
};

const downloadExitBill = async (req, res) => {
    const entryId = req.params.entryId;
    console.log(`[Public ExitBillDownload] Attempting for entry ID: ${entryId}`);

    try {
        const vehicleEntry = await prisma.vehicleEntry.findUnique({
            where: { id: entryId },
            include: {
                parking: true, // For charge_per_hour and parking details
                recorded_by: { // Staff who recorded the entry/exit actions (optional for bill)
                    select: { firstName: true, lastName: true }
                }
            }
        });

        if (!vehicleEntry) {
            console.error(`[Public ExitBillDownload] Vehicle entry record not found for ID: ${entryId}`);
            return res.status(404).json({ message: "Vehicle entry record not found." });
        }
        console.log(`[Public ExitBillDownload] Found vehicle entry:`, JSON.stringify(vehicleEntry, null, 2));

        if (vehicleEntry.status !== VehicleEntryStatus.EXITED ||
            vehicleEntry.charged_amount === null || vehicleEntry.charged_amount === undefined ||
            vehicleEntry.exit_time === null || vehicleEntry.exit_time === undefined) {
            console.warn(`[Public ExitBillDownload] Bill generation conditions not met for entry ${entryId}. Status: ${vehicleEntry.status}, Charged: ${vehicleEntry.charged_amount}, Exit Time: ${vehicleEntry.exit_time}`);
            return res.status(400).json({ message: "Exit bill can only be generated for fully exited vehicles with a charged amount and exit time." });
        }
        console.log(`[Public ExitBillDownload] Entry is EXITED and has charge/exit time. Proceeding to generate PDF bill.`);

        // Determine the name to put on the bill as "Processed by"
        // This would be the staff member who last updated the record (likely recorded the exit)
        let processedByName = 'System';
        if (vehicleEntry.recorded_by) {
            processedByName = `${vehicleEntry.recorded_by.firstName || ''} ${vehicleEntry.recorded_by.lastName || ''}`.trim() || 'ParkWell Staff';
        }

        const billData = {
            // userRecordedBy is now about who is on record for this VehicleEntry action
            // For a public download, we can't know who is *currently* downloading it.
            // So, the PDF might say "Processed by: [Name of attendant who recorded exit]"
            userRecordedBy: { // This now refers to the staff member associated with the VehicleEntry record
                firstName: vehicleEntry.recorded_by?.firstName, // Use optional chaining
                lastName: vehicleEntry.recorded_by?.lastName
            },
            processedByForDisplay: processedByName, // A combined name for display
            vehicleEntry: vehicleEntry, // Contains all nested data like .parking
            appName: "ParkWell Systems"
        };
        console.log(`[Public ExitBillDownload] Data for PDF bill:`, JSON.stringify(billData, null, 2));

        const pdfBuffer = await generateExitBillPdf(billData); // Ensure generateExitBillPdf uses billData.processedByForDisplay
        console.log(`[Public ExitBillDownload] PDF bill buffer generated for ${entryId}. Length: ${pdfBuffer.length}`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="exit-bill-${vehicleEntry.ticket_number}.pdf"`);
        console.log(`[Public ExitBillDownload] Sending PDF bill for ${entryId}.`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('[Public ExitBillDownload] Critical error:', error);
        console.error('[Public ExitBillDownload] Error stack:', error.stack);
        res.status(500).json({ message: "Failed to generate or download exit bill." });
    }
};

const listVehicleEntries = async (req, res) => {
    try {
        const {
            page = 1, limit = 10, sortBy = 'entry_time', order = 'desc',
            status, // e.g., "PARKED", "EXITED"
            plate_number_search, // Search by plate
            parking_id_filter,   // Filter by specific parking facility
            entryDateFrom,       // YYYY-MM-DD
            entryDateTo,         // YYYY-MM-DD
            // exitDateFrom,     // For reports on exited vehicles
            // exitDateTo
        } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (status && Object.values(VehicleEntryStatus).includes(status.toUpperCase())) {
            where.status = status.toUpperCase();
        }
        if (plate_number_search) {
            where.plate_number = { contains: plate_number_search, mode: 'insensitive' };
        }
        if (parking_id_filter) {
            where.parking_id = parking_id_filter;
        }

        if (entryDateFrom || entryDateTo) {
            where.entry_time = {};
            if (entryDateFrom) {
                const sDate = new Date(entryDateFrom);
                if (!isNaN(sDate.getTime())) where.entry_time.gte = sDate;
            }
            if (entryDateTo) {
                const eDate = new Date(entryDateTo);
                if (!isNaN(eDate.getTime())) {
                    eDate.setHours(23, 59, 59, 999); // Include whole end day
                    where.entry_time.lte = eDate;
                }
            }
        }
        // Add similar logic for exit_time if filtering exited vehicles

        const orderByOptions = {};
        // Define allowed sort fields for vehicle entries
        if (['entry_time', 'plate_number', 'status', 'exit_time', 'charged_amount'].includes(sortBy)) {
            orderByOptions[sortBy] = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
        } else {
            orderByOptions.entry_time = 'desc'; // Default sort
        }

        const entries = await prisma.vehicleEntry.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: orderByOptions,
            include: {
                parking: { select: { code: true, name: true } }, // Include parking info
                recorded_by: { select: { firstName: true, lastName: true } }, // Attendant info
            },
        });
        const totalEntries = await prisma.vehicleEntry.count({ where });

        res.status(200).json({
            data: entries,
            pagination: { /* ... pagination data ... */ },
        });
    } catch (error) {
        console.error('List vehicle entries error:', error);
        res.status(500).json({ message: 'Server error retrieving vehicle entries' });
    }
};
module.exports = {
    recordVehicleEntry,
    downloadEntryTicket,
    recordVehicleExit,    // <-- NEW
    downloadExitBill,     // <-- NEW
    listVehicleEntries
};