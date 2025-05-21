
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticateToken, checkPermission } = require("../middleware/auth");

router.use(authenticateToken);

router.put(
  "/profile",
  checkPermission("manage_own_profile"),
  userController.updateUserProfile
);


module.exports = router;
