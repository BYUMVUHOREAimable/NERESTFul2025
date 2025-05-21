// middleware/auth.js
const { verifyToken } = require("../config/auth"); // Using the simplified verifyToken
const prisma = require("../config/database");

/**
 * Middleware to authenticate requests using JWT.
 * Attaches user payload to req.user if token is valid.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token is missing" });
  }

  const payload = verifyToken(token); // Uses the simplified verifyToken

  if (!payload) {
    return res
      .status(401)
      .json({ message: "Access token is invalid or expired" });
  }

  req.user = payload;
  next();
};

/**
 * Middleware to check if the authenticated user has a specific role.
 */
const checkRole = (roleName) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.role_id) {
      return res
        .status(403)
        .json({
          message: "Forbidden: User role information is missing or invalid.",
        });
    }
    // Using role_name from token for efficiency, assuming it's set correctly during token generation
    if (req.user.role_name !== roleName) {
      return res
        .status(403)
        .json({ message: `Forbidden. Requires ${roleName} role.` });
    }
    next();
  };
};

/**
 * Middleware to check if the authenticated user has a specific permission.
 */
const checkPermission = (permissionName) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.role_id) {
      return res
        .status(403)
        .json({
          message: "Forbidden: User role information is missing or invalid.",
        });
    }
    try {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { role_id: req.user.role_id },
        include: { permission: { select: { name: true } } },
      });
      const hasPerm = rolePermissions.some(
        (rp) => rp.permission.name === permissionName
      );
      if (!hasPerm) {
        return res
          .status(403)
          .json({
            message: `Forbidden. Requires '${permissionName}' permission.`,
          });
      }
      next();
    } catch (error) {
      console.error("Error checking permission:", error);
      return res
        .status(500)
        .json({ message: "Server error during permission check" });
    }
  };
};

/**
 * Middleware to check if the authenticated user has ANY of the specified permissions.
 */
const checkAnyPermission = (permissionNames) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.role_id) {
      return res
        .status(403)
        .json({
          message: "Forbidden: User role information is missing or invalid.",
        });
    }
    if (!Array.isArray(permissionNames) || permissionNames.length === 0) {
      console.warn(
        "checkAnyPermission called with no or invalid permissionNames array"
      );
      return res
        .status(500)
        .json({ message: "Server configuration error for permission check." });
    }
    try {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { role_id: req.user.role_id },
        include: { permission: { select: { name: true } } },
      });
      const userPermissionList = rolePermissions.map(
        (rp) => rp.permission.name
      );
      const hasAnyPerm = permissionNames.some((pName) =>
        userPermissionList.includes(pName)
      );
      if (!hasAnyPerm) {
        return res
          .status(403)
          .json({
            message: `Forbidden. Requires one of the following permissions: ${permissionNames.join(
              ", "
            )}.`,
          });
      }
      next();
    } catch (error) {
      console.error("Error checking any permission:", error);
      return res
        .status(500)
        .json({ message: "Server error during permission check" });
    }
  };
};

module.exports = {
  authenticateToken,
  checkRole,
  checkPermission,
  checkAnyPermission,
};
