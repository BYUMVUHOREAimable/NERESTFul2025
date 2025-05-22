
const prisma = require("../config/database");
const bcrypt = require("bcrypt");
const { generateVerificationCode } = require("../utils/helpers");
const { sendEmail } = require("../config/email");
const { renderEmailTemplate } = require("../utils/renderEmailTemplate");

const { RoleName } = require("@prisma/client");

const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "created_at",
      order = "desc",
      role,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) {
      const roleEnumKey = Object.keys(RoleName).find(
        (key) => RoleName[key] === role.toUpperCase()
      );
      if (roleEnumKey) {
        where.role = { name: RoleName[roleEnumKey] };
      }
    }

    const orderByOptions = {};
    if (["name", "email", "created_at"].includes(sortBy)) {
      orderByOptions[sortBy] = order.toLowerCase() === "asc" ? "asc" : "desc";
    } else if (sortBy === "role") {
      orderByOptions.role = {
        name: order.toLowerCase() === "asc" ? "asc" : "desc",
      };
    } else {
      orderByOptions.created_at = "desc";
    }

    const users = await prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: orderByOptions,
      select: {
        
        id: true, 
        name: true,
        email: true,
        email_verified: true,
        role: {
          select: {
            name: true,
          
          },
        },
        created_at: true,
        updated_at: true,
      
      },
    });

    const totalUsers = await prisma.user.count({ where });

    res.status(200).json({
      data: users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalItems: totalUsers,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Admin get all users error:", error);
    res.status(500).json({ message: "Server error retrieving users" });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        email_verified: true,
        role: { select: { id: true, name: true } },
        created_at: true,
        updated_at: true,
       
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Admin get user by ID error:", error);
    res.status(500).json({ message: "Server error retrieving user" });
  }
};


const createUser = async (req, res) => {
  try {
    const { name, email, password, roleName = "USER" } = req.body;

    
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }
  
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const roleEnumKey = Object.keys(RoleName).find(
      (key) => RoleName[key] === roleName.toUpperCase()
    );
    if (!roleEnumKey) {
      return res.status(400).json({
        message: `Invalid role name: ${roleName}. Valid roles are USER, ADMIN.`,
      });
    }
    const targetRole = await prisma.role.findUnique({
      where: { name: RoleName[roleEnumKey] },
    });
    if (!targetRole) {
      return res
        .status(400)
        .json({ message: `Role '${roleName}' not found in database.` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role_id: targetRole.id,
        email_verification_code: verificationCode,
        email_verified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
      },
    });

    res.status(201).json({
      message: "User created successfully by admin. Verification email sent.",
      user: newUser,
    });
  } catch (error) {
    console.error("Admin create user error:", error);
    res.status(500).json({ message: "Server error creating user" });
  }
};

const updateUser = async (req, res) => {
  try {
    const userIdToUpdate = req.params.id;
    const { name, email, roleName, email_verified, newPassword } = req.body;
    const adminUserId = req.user.user_id;

    const updateData = {};

    if (userIdToUpdate === adminUserId && typeof roleName === 'string' && roleName.trim() !== '') {
      const userBeingUpdated = await prisma.user.findUnique({
        where: { id: userIdToUpdate },
        include: { role: true },
      });
      if (
        userBeingUpdated &&
        userBeingUpdated.role.name === RoleName.ADMIN &&
        roleName.toUpperCase() !== RoleName.ADMIN
      ) {
        return res
          .status(400)
          .json({ message: "Admin cannot change their own role from ADMIN." });
      }
    }


    if (name && typeof name === 'string') updateData.name = name.trim();
    if (typeof email_verified === 'boolean') {
      updateData.email_verified = email_verified;
    }

    if (email && typeof email === 'string') {
      const trimmedEmail = email.trim().toLowerCase();
      const existingEmailUser = await prisma.user.findFirst({
        where: { email: trimmedEmail, NOT: { id: userIdToUpdate } },
      });
      if (existingEmailUser) {
        return res
          .status(400)
          .json({ message: "Email address is already in use by another user" });
      }
      updateData.email = trimmedEmail;
      
    }

  
    if (roleName && typeof roleName === 'string' && roleName.trim() !== '') {
      const upperRoleName = roleName.trim().toUpperCase();
      const roleEnumKey = Object.keys(RoleName).find(
        (key) => RoleName[key] === upperRoleName
      );
      if (!roleEnumKey) {
        return res.status(400).json({
          message: `Invalid role name: ${roleName}. Valid roles are USER, ADMIN.`,
        });
      }
      const targetRole = await prisma.role.findUnique({
        where: { name: RoleName[roleEnumKey] },
      });
      if (!targetRole) {
        return res
          .status(400)
          .json({ message: `Role '${upperRoleName}' not found in database roles.` });
      }
      updateData.role_id = targetRole.id;
    }

    if (newPassword && typeof newPassword === 'string') {
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "New password must be at least 6 characters" });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid update data provided" });
    }

    const userToUpdateExists = await prisma.user.findUnique({ where: { id: userIdToUpdate } });
    if (!userToUpdateExists) {
      return res.status(404).json({ message: 'User not found to update.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: updateData,
      select: { 
        id: true,
        name: true,
        email: true,
        email_verified: true,
        role: { select: { name: true } },
        created_at: true, 
        updated_at: true
      },
    });

    res.status(200).json({
      message: "User updated successfully by admin",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Admin update user error:", error);
  
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found to update (or concurrent deletion)." });
    }
    res.status(500).json({ message: error.message || "Server error updating user" });
  }
};



const deleteUser = async (req, res) => {
  try {
    const userIdToDelete = req.params.id;
    
    const adminUserId = req.user.user_id;

    if (userIdToDelete === adminUserId) {
      return res
        .status(400)
        .json({ message: "Admin cannot delete their own account" });
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userIdToDelete },
    });
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.user.delete({
      where: { id: userIdToDelete },
    });

  

    res.status(200).json({ message: "User deleted successfully by admin" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    if (error.code === "P2025") {
     
      return res.status(404).json({ message: "User not found to delete." });
    }
    
    res.status(500).json({ message: "Server error deleting user" });
  }
};


const getAllRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, description: true },
    });
    res.status(200).json(roles);
  } catch (error) {
    console.error("Admin get all roles error:", error);
    res.status(500).json({ message: "Server error retrieving roles" });
  }
};


const getAllPermissions = async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      select: { id: true, name: true, description: true },
    });
    res.status(200).json(permissions);
  } catch (error) {
    console.error("Admin get all permissions error:", error);
    res.status(500).json({ message: "Server error retrieving permissions" });
  }
};


const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "timestamp",
      order = "desc",
      userId,
      actionContains,
      entityType, 
      entityId, 
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (userId) {
      where.user_id = userId;
     
    }
    if (actionContains) {
      where.action = { contains: actionContains, mode: "insensitive" };
    }
    if (entityType) {
      where.entity_type = { equals: entityType, mode: "insensitive" };
    }
    if (entityId) {
      where.entity_id = parseInt(entityId, 10);
      
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        const sDate = new Date(startDate);
        if (isNaN(sDate.getTime()))
          return res.status(400).json({ message: "Invalid startDate." });
        where.timestamp.gte = sDate;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        if (isNaN(eDate.getTime()))
          return res.status(400).json({ message: "Invalid endDate." });
        eDate.setHours(23, 59, 59, 999); 
        where.timestamp.lte = eDate;
      }
    }

    const orderByOptions = {};
    if (["timestamp", "action", "entity_type", "user_id"].includes(sortBy)) {
      orderByOptions[sortBy] = order.toLowerCase() === "asc" ? "asc" : "desc";
    } else {
      orderByOptions.timestamp = "desc"; 
    }

    const logs = await prisma.log.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: orderByOptions,
      include: {
        user: {
          
          select: { id: true, name: true, email: true },
        },
      },
    });

    const totalLogs = await prisma.log.count({ where });

    res.status(200).json({
      data: logs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalLogs / limitNum),
        totalItems: totalLogs,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Admin get audit logs error:", error);
    res.status(500).json({ message: "Server error retrieving audit logs" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllRoles,
  getAllPermissions,
  getAuditLogs,
};
