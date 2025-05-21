
const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicle.controller");
const { authenticateToken, checkPermission } = require("../middleware/auth");


router.use(authenticateToken);


router.post(
  "/",
  checkPermission("manage_own_vehicles"),
  vehicleController.addVehicle
);
router.get(
  "/",
  checkPermission("list_own_vehicles"),
  vehicleController.listMyVehicles
);
router.get(
  "/:id",
  checkPermission("manage_own_vehicles"),
  vehicleController.getMyVehicleById
);
router.put(
  "/:id",
  checkPermission("manage_own_vehicles"),
  vehicleController.updateMyVehicle
);
router.delete(
  "/:id",
  checkPermission("manage_own_vehicles"),
  vehicleController.deleteMyVehicle
);

module.exports = router;
