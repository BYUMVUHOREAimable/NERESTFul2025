
const prisma = require('../config/database');
const { Prisma } = require('@prisma/client'); 
const { logAction } = require('../utils/logger');


const createParkingFacility = async (req, res) => {
  try {
    const { code, name, total_spaces, location, charge_per_hour } = req.body;
    const adminUserId = req.user.user_id;

    
    if (!code || !name || total_spaces === undefined || charge_per_hour === undefined) {
      return res.status(400).json({ message: 'Code, name, total spaces, and charge per hour are required.' });
    }
    if (typeof total_spaces !== 'number' || total_spaces <= 0) {
      return res.status(400).json({ message: 'Total spaces must be a positive number.' });
    }
    
    const charge = parseFloat(charge_per_hour);
    if (isNaN(charge) || charge < 0) {
      return res.status(400).json({ message: 'Charge per hour must be a non-negative number.' });
    }
    if (!/^[A-Z0-9_-]{1,10}$/i.test(code)) { 
      return res.status(400).json({ message: 'Parking code must be 1-10 alphanumeric characters, underscores, or hyphens.' });
    }
    

    const existingParkingByCode = await prisma.parking.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existingParkingByCode) {
      return res.status(400).json({ message: `Parking facility with code '${code.toUpperCase()}' already exists.` });
    }

    const newParking = await prisma.parking.create({
      data: {
        code: code.toUpperCase(),
        name,
        total_spaces: parseInt(total_spaces, 10),
        location: location || null,
        charge_per_hour: new Prisma.Decimal(charge_per_hour),
        occupied_spaces: 0, 
      },
    });

   

    res.status(201).json({ message: 'Parking facility created successfully', parking: newParking });
  } catch (error) {
    console.error('Create parking facility error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      return res.status(400).json({ message: `Parking facility with code '${req.body.code.toUpperCase()}' already exists (concurrent request).` });
    }
    res.status(500).json({ message: 'Server error creating parking facility' });
  }
};


const getAllParkingFacilities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '', 
      sortBy = 'name',
      order = 'asc',
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderByOptions = {};
    if (['name', 'code', 'total_spaces', 'occupied_spaces', 'charge_per_hour', 'location', 'created_at'].includes(sortBy)) {
      orderByOptions[sortBy] = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
    } else {
      orderByOptions.name = 'asc'; 
    }

    const parkings = await prisma.parking.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: orderByOptions,
    });

    const totalParkings = await prisma.parking.count({ where });

    res.status(200).json({
      data: parkings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalParkings / limitNum),
        totalItems: totalParkings,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error('Get all parking facilities error:', error);
    res.status(500).json({ message: 'Server error retrieving parking facilities' });
  }
};


const getParkingFacilityById = async (req, res) => {
  try {
    const parkingId = req.params.id; 

    const parking = await prisma.parking.findUnique({
      where: { id: parkingId },
    });

    if (!parking) {
      return res.status(404).json({ message: 'Parking facility not found' });
    }

    res.status(200).json(parking);
  } catch (error) {
    console.error('Get parking facility by ID error:', error);
    res.status(500).json({ message: 'Server error retrieving parking facility' });
  }
};


const updateParkingFacility = async (req, res) => {
  try {
    const parkingId = req.params.id; 
    const { code, name, total_spaces, location, charge_per_hour, occupied_spaces } = req.body;
    const adminUserId = req.user.user_id;

    const parkingToUpdate = await prisma.parking.findUnique({ where: { id: parkingId } });
    if (!parkingToUpdate) {
      return res.status(404).json({ message: "Parking facility not found." });
    }

    const updateData = {};
    if (code) {
      const newCode = code.toUpperCase();
      if (newCode !== parkingToUpdate.code) {
        const existingParkingByCode = await prisma.parking.findFirst({
          where: { code: newCode, NOT: { id: parkingId } },
        });
        if (existingParkingByCode) {
          return res.status(400).json({ message: `Parking facility code '${newCode}' already in use.` });
        }
      }
      if (!/^[A-Z0-9_-]{1,10}$/i.test(newCode)) {
        return res.status(400).json({ message: 'Parking code must be 1-10 alphanumeric characters, underscores, or hyphens.' });
      }
      updateData.code = newCode;
    }
    if (name) updateData.name = name;
    if (total_spaces !== undefined) {
      const ts = parseInt(total_spaces, 10);
      if (isNaN(ts) || ts < 0) return res.status(400).json({ message: "Total spaces must be a non-negative number." });
      
      if (ts < parkingToUpdate.occupied_spaces) {
        return res.status(400).json({ message: `Total spaces (${ts}) cannot be less than currently occupied spaces (${parkingToUpdate.occupied_spaces}).` });
      }
      updateData.total_spaces = ts;
    }
    if (location !== undefined) updateData.location = location || null; 
    if (charge_per_hour !== undefined) {
      const charge = parseFloat(charge_per_hour);
      if (isNaN(charge) || charge < 0) return res.status(400).json({ message: "Charge per hour must be a non-negative number." });
      updateData.charge_per_hour = new Prisma.Decimal(charge_per_hour);
    }
    if (occupied_spaces !== undefined) { 
      const os = parseInt(occupied_spaces, 10);
      if (isNaN(os) || os < 0) return res.status(400).json({ message: "Occupied spaces must be a non-negative number." });
      if (updateData.total_spaces !== undefined && os > updateData.total_spaces) {
        return res.status(400).json({ message: `Occupied spaces (${os}) cannot exceed new total spaces (${updateData.total_spaces}).` });
      } else if (updateData.total_spaces === undefined && os > parkingToUpdate.total_spaces) {
        return res.status(400).json({ message: `Occupied spaces (${os}) cannot exceed current total spaces (${parkingToUpdate.total_spaces}).` });
      }
      updateData.occupied_spaces = os;
    }


    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No update data provided' });
    }

    const updatedParking = await prisma.parking.update({
      where: { id: parkingId },
      data: updateData,
    });


    res.status(200).json({ message: 'Parking facility updated successfully', parking: updatedParking });
  } catch (error) {
    console.error('Update parking facility error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Parking facility not found to update.' });
    } else if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      return res.status(400).json({ message: `Parking facility with code '${req.body.code.toUpperCase()}' already exists.` });
    }
    res.status(500).json({ message: 'Server error updating parking facility' });
  }
};


const deleteParkingFacility = async (req, res) => {
  try {
    const parkingId = req.params.id; 
    const adminUserId = req.user.user_id;

    
    const activeEntriesCount = await prisma.vehicleEntry.count({
      where: {
        parking_id: parkingId,
        status: 'PARKED', 
      },
    });

    if (activeEntriesCount > 0) {
      return res.status(400).json({
        message: `Cannot delete parking facility. There are ${activeEntriesCount} vehicle(s) currently parked here. Please ensure all vehicles exit first.`,
      });
    }

    const parkingToDelete = await prisma.parking.findUnique({ where: { id: parkingId } });
    if (!parkingToDelete) {
      return res.status(404).json({ message: 'Parking facility not found.' });
    }

    
    await prisma.parking.delete({
      where: { id: parkingId },
    });



    res.status(200).json({ message: 'Parking facility deleted successfully' });
  } catch (error) {
    console.error('Delete parking facility error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Parking facility not found to delete.' });
    } else if (error.code === 'P2003') { 
      return res.status(400).json({ message: 'Cannot delete parking facility. It may still have historical vehicle entries associated. Consider deactivating instead.' })
    }
    res.status(500).json({ message: 'Server error deleting parking facility' });
  }
};


const getSelectableParkingFacilities = async (req, res) => {
  try {
    
    const { search = '', limit = 200 } = req.query; 
    const where = {};
   

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const parkings = await prisma.parking.findMany({
      where,
      take: parseInt(limit, 10),
      orderBy: { name: 'asc' }, 
      select: { 
        id: true,
        code: true,
        name: true,
        total_spaces: true,
        occupied_spaces: true,
       
      }
    });

    res.status(200).json({ data: parkings });
  } catch (error) {
    console.error('Get selectable parking facilities error:', error);
    res.status(500).json({ message: 'Server error retrieving parking facilities for selection' });
  }
};


module.exports = {
  createParkingFacility,
  getAllParkingFacilities,
  getParkingFacilityById,
  updateParkingFacility,
  deleteParkingFacility,
  getSelectableParkingFacilities
};