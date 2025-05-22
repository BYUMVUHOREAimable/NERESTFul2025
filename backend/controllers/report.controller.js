
const prisma = require('../config/database');
const { VehicleEntryStatus, Prisma } = require('@prisma/client'); 


const getExitedVehiclesReport = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 15, 
            sortBy = 'exit_time',
            order = 'desc',
            startDate, 
            endDate,   
            parkingId,
        } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const where = {
            status: VehicleEntryStatus.EXITED,
            exit_time: { 
                not: null
            }
        };

        if (startDate) {
            const sDate = new Date(startDate);
            if (!isNaN(sDate.getTime())) {
                where.exit_time.gte = sDate; 
                return res.status(400).json({ message: "Invalid startDate format. Use YYYY-MM-DD." });
            }
        }
        if (endDate) {
            const eDate = new Date(endDate);
            if (!isNaN(eDate.getTime())) {
                eDate.setHours(23, 59, 59, 999); 
                where.exit_time.lte = eDate; 
            } else {
                return res.status(400).json({ message: "Invalid endDate format. Use YYYY-MM-DD." });
            }
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: "startDate cannot be after endDate." });
        }
        if (parkingId) {
            where.parking_id = parkingId;
        }


        const orderByOptions = {};
        const validSortFields = ['exit_time', 'plate_number', 'charged_amount', 'calculated_duration_minutes', 'parking.name'];
        if (validSortFields.includes(sortBy)) {
            if (sortBy.startsWith('parking.')) {
                const parts = sortBy.split('.');
                orderByOptions[parts[0]] = { [parts[1]]: order.toLowerCase() === 'asc' ? 'asc' : 'desc' };
            } else {
                orderByOptions[sortBy] = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
            }
        } else {
            orderByOptions.exit_time = 'desc'; 
        }

        const exitedEntries = await prisma.vehicleEntry.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: orderByOptions,
            include: {
                parking: { select: { code: true, name: true, charge_per_hour: true } },
                recorded_by: { select: { firstName: true, lastName: true } },
            },
        });

        const totalExitedEntries = await prisma.vehicleEntry.count({ where });

        
        const summaryAggregation = await prisma.vehicleEntry.aggregate({
            _sum: { charged_amount: true },
            _count: { id: true }, 
            where,
        });


        res.status(200).json({
            data: exitedEntries,
            summary: {
                totalVehiclesExited: summaryAggregation._count.id || 0,
                totalRevenue: summaryAggregation._sum.charged_amount || new Prisma.Decimal(0),
            },
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalExitedEntries / limitNum),
                totalItems: totalExitedEntries,
                itemsPerPage: limitNum,
            },
        });
    } catch (error) {
        console.error('Get Exited Vehicles Report error:', error);
        res.status(500).json({ message: 'Server error generating exited vehicles report' });
    }
};


const getEnteredVehiclesReport = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 15,
            sortBy = 'entry_time',
            order = 'desc',
            startDate, 
            endDate,   
            parkingId, 
        } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const where = {
            entry_time: {} 
        };

        if (startDate) {
            const sDate = new Date(startDate);
            if (!isNaN(sDate.getTime())) {
                where.entry_time.gte = sDate;
            } else {
                return res.status(400).json({ message: "Invalid startDate format. Use YYYY-MM-DD." });
            }
        }
        if (endDate) {
            const eDate = new Date(endDate);
            if (!isNaN(eDate.getTime())) {
                eDate.setHours(23, 59, 59, 999);
                where.entry_time.lte = eDate;
            } else {
                return res.status(400).json({ message: "Invalid endDate format. Use YYYY-MM-DD." });
            }
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: "startDate cannot be after endDate." });
        }
        if (parkingId) {
            where.parking_id = parkingId;
        }


        const orderByOptions = {};
        const validSortFields = ['entry_time', 'plate_number', 'status', 'parking.name'];
        if (validSortFields.includes(sortBy)) {
            if (sortBy.startsWith('parking.')) {
                const parts = sortBy.split('.');
                orderByOptions[parts[0]] = { [parts[1]]: order.toLowerCase() === 'asc' ? 'asc' : 'desc' };
            } else {
                orderByOptions[sortBy] = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
            }
        } else {
            orderByOptions.entry_time = 'desc';
        }

        const enteredEntries = await prisma.vehicleEntry.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: orderByOptions,
            include: {
                parking: { select: { code: true, name: true } },
                recorded_by: { select: { firstName: true, lastName: true } },
            },
        });

        const totalEnteredEntries = await prisma.vehicleEntry.count({ where });

        const summaryAggregation = await prisma.vehicleEntry.aggregate({
            _count: { id: true },
            where,
        });

        res.status(200).json({
            data: enteredEntries,
            summary: {
                totalVehiclesEntered: summaryAggregation._count.id || 0,
            },
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalEnteredEntries / limitNum),
                totalItems: totalEnteredEntries,
                itemsPerPage: limitNum,
            },
        });
    } catch (error) {
        console.error('Get Entered Vehicles Report error:', error);
        res.status(500).json({ message: 'Server error generating entered vehicles report' });
    }
};


module.exports = {
    getExitedVehiclesReport,
    getEnteredVehiclesReport,
};