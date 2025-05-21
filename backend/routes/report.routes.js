
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateToken, checkRole, checkPermission } = require('../middleware/auth');
const { RoleName } = require('@prisma/client');

router.use(authenticateToken);
router.use(checkRole(RoleName.ADMIN));
router.use(checkPermission('view_system_reports'));

router.get('/exited-vehicles', reportController.getExitedVehiclesReport);
router.get('/entered-vehicles', reportController.getEnteredVehiclesReport);

module.exports = router;