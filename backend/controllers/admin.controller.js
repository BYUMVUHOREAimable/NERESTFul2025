// controllers/admin.controller.js
const prisma = require("../config/database");
const bcrypt = require("bcrypt");
const { generateVerificationCode } = require("../utils/helpers"); // For email verification if admin creates user
const { sendEmail } = require("../config/email");
const { renderEmailTemplate } = require("../utils/renderEmailTemplate");

const { RoleName } = require("@prisma/client"); // To access RoleName.USER etc.

/**
 * (Admin) Get all users with pagination, search, and sorting.
 */
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

    const pageNum = parseInt(page, 10); // Keep parseInt for page and limit
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
        // <--- USE ONLY SELECT
        id: true, // id is now a String (UUID)
        name: true,
        email: true,
        email_verified: true,
        role: {
          select: {
            name: true, // Select the name from the related role
            // id: true,  // You could also select role.id if needed
          },
        },
        created_at: true,
        updated_at: true,
        // IMPORTANT: Do NOT include 'password' here or in any general listing
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
/**
 * (Admin) Get a specific user by ID.
 */
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    // if (isNaN(userId)) {
    //   return res.status(400).json({ message: "Invalid user ID format." });
    // }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        // Select specific fields to return, excluding password
        id: true,
        name: true,
        email: true,
        email_verified: true,
        role: { select: { id: true, name: true } },
        created_at: true,
        updated_at: true,
        // vehicles: true, // Optional: include related data if needed by admin
        // slot_requests: true,
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

/**
 * (Admin) Create a new user.
 * Admin can specify the role. If not, defaults to 'USER'.
 * Sends email verification.
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, roleName = "USER" } = req.body; // Default role to USER

    // Add robust validation here (e.g., using the validation functions we discussed)
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }
    // Example basic password length validation
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
        email_verified: false, // New users created by admin should also verify
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
      },
    });

    // const htmlEmail = renderEmailTemplate("verificationEmail", {
    //   name: newUser.name,
    //   verificationCode: verificationCode,
    // });
    // if (htmlEmail) {
    //   await sendEmail(
    //     email,
    //     "Verify Your Email - Account Created by Admin",
    //     `An account has been created for you. Your verification code is: ${verificationCode}`,
    //     htmlEmail
    //   );
    // }



    res.status(201).json({
      message: "User created successfully by admin. Verification email sent.",
      user: newUser,
    });
  } catch (error) {
    console.error("Admin create user error:", error);
    res.status(500).json({ message: "Server error creating user" });
  }
};

/**
 * (Admin) Update a user's details, including their role.
 */
const updateUser = async (req, res) => {
  try {
    const userIdToUpdate = req.params.id; // This is a UUID string
    const { name, email, roleName, email_verified, newPassword } = req.body;
    const adminUserId = req.user.user_id; // UUID of the logged-in admin

    const updateData = {};

    // Check if admin is trying to change their own role from ADMIN
    if (userIdToUpdate === adminUserId && typeof roleName === 'string' && roleName.trim() !== '') {
      const userBeingUpdated = await prisma.user.findUnique({
        where: { id: userIdToUpdate },
        include: { role: true },
      });
      if (
        userBeingUpdated &&
        userBeingUpdated.role.name === RoleName.ADMIN &&
        roleName.toUpperCase() !== RoleName.ADMIN // Check against the intended new roleName
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
      const trimmedEmail = email.trim().toLowerCase(); // Normalize email
      const existingEmailUser = await prisma.user.findFirst({
        where: { email: trimmedEmail, NOT: { id: userIdToUpdate } },
      });
      if (existingEmailUser) {
        return res
          .status(400)
          .json({ message: "Email address is already in use by another user" });
      }
      updateData.email = trimmedEmail;
      // If admin changes email, we might want to set email_verified to false by default
      // and let them explicitly set it to true if desired.
      // For now, if 'email_verified' isn't explicitly in req.body, it won't be changed by an email update.
    }

    // Only process roleName if it's a non-empty string
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
        where: { name: RoleName[roleEnumKey] }, // This uses the actual enum member
      });
      if (!targetRole) {
        // This case should be rare if the previous check passes, means DB is inconsistent
        return res
          .status(400)
          .json({ message: `Role '${upperRoleName}' not found in database roles.` });
      }
      updateData.role_id = targetRole.id;
    }

    if (newPassword && typeof newPassword === 'string') {
      if (newPassword.length < 6) { // Add more robust validation (e.g., from your production rules)
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
      select: { // Select fields to return
        id: true,
        name: true,
        email: true,
        email_verified: true,
        role: { select: { name: true } },
        created_at: true, // Added for consistency
        updated_at: true  // Added for consistency
      },
    });

    res.status(200).json({
      message: "User updated successfully by admin",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    // Prisma's P2025 for "Record to update not found" might be caught if userToUpdateExists check fails due to race condition
    // but the explicit check above is good.
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found to update (or concurrent deletion)." });
    }
    res.status(500).json({ message: error.message || "Server error updating user" });
  }
};


/**
 * (Admin) Delete a user.
 * Prevents admin from deleting themselves.
 */
const deleteUser = async (req, res) => {
  try {
    const userIdToDelete = req.params.id;
    // if (isNaN(userIdToDelete)) {
    //   return res.status(400).json({ message: "Invalid user ID format." });
    // }
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

    // Consider implications: what happens to vehicles, slot requests of the deleted user?
    // Prisma's onDelete: Cascade on Vehicle/SlotRequest will handle this if set.
    // If not, you might need to manually handle or prevent deletion if related records exist.
    await prisma.user.delete({
      where: { id: userIdToDelete },
    });

  

    res.status(200).json({ message: "User deleted successfully by admin" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    if (error.code === "P2025") {
      // Record to delete not found
      return res.status(404).json({ message: "User not found to delete." });
    }
    // Handle foreign key constraint errors if cascade delete is not set up perfectly
    // e.g., error.code === 'P2003'
    res.status(500).json({ message: "Server error deleting user" });
  }
};

// --- Role and Permission Info (Read-only for Admin) ---
/**
 * (Admin) Get all available roles.
 */
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

/**
 * (Admin) Get all available permissions.
 */
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

// --- Audit Log Management by Admin ---

/**
 * (Admin) Get audit logs with pagination and filtering.
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "timestamp",
      order = "desc",
      userId, // Filter by specific user ID
      actionContains, // Filter by text in action description
      entityType, // Filter by entity type (e.g., "User", "Vehicle")
      entityId, // Filter by specific entity ID
      startDate, // Filter by date range
      endDate,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (userId) {
      where.user_id = userId;
      // if (isNaN(where.user_id))
      //   return res.status(400).json({ message: "Invalid userId filter." });
    }
    if (actionContains) {
      where.action = { contains: actionContains, mode: "insensitive" };
    }
    if (entityType) {
      where.entity_type = { equals: entityType, mode: "insensitive" };
    }
    if (entityId) {
      where.entity_id = parseInt(entityId, 10);
      // if (isNaN(where.entity_id))
      //   return res.status(400).json({ message: "Invalid entityId filter." });
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
        eDate.setHours(23, 59, 59, 999); // Include whole end day
        where.timestamp.lte = eDate;
      }
    }

    const orderByOptions = {};
    if (["timestamp", "action", "entity_type", "user_id"].includes(sortBy)) {
      orderByOptions[sortBy] = order.toLowerCase() === "asc" ? "asc" : "desc";
    } else {
      orderByOptions.timestamp = "desc"; // Default sort
    }

    const logs = await prisma.log.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: orderByOptions,
      include: {
        user: {
          // Include user details for better log readability
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
