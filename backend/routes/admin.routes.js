// routes/admin.routes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const {
  authenticateToken,
  checkRole,
  checkPermission,
} = require("../middleware/auth");
const { RoleName } = require("@prisma/client");

router.use(authenticateToken);
router.use(checkRole(RoleName.ADMIN));

router.get(
  "/users",
  checkPermission("manage_all_users"),
  adminController.getAllUsers
);
router.post(
  "/users",
  checkPermission("manage_all_users"),
  adminController.createUser
);
router.get(
  "/users/:id",
  checkPermission("manage_all_users"),
  adminController.getUserById
);
router.put(
  "/users/:id",
  checkPermission("manage_all_users"),
  adminController.updateUser
);
router.delete(
  "/users/:id",
  checkPermission("manage_all_users"),
  adminController.deleteUser
);


router.get("/roles", adminController.getAllRoles); 
router.get("/permissions", adminController.getAllPermissions); 
router.get('/logs', checkPermission('view_audit_logs'), adminController.getAuditLogs); 


module.exports = router;
