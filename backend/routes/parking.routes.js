const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parking.controller');
const { authenticateToken, checkRole, checkPermission, checkAnyPermission } = require('../middleware/auth');
const { RoleName } = require('@prisma/client');

router.use(authenticateToken);

// --- PARKING MANAGEMENT ROUTES ---
router.get('/',
    checkAnyPermission(['manage_parkings', 'view_all_parkings_details']),
    parkingController.getAllParkingFacilities
);

router.get('/selectable',
    checkAnyPermission(['list_selectable_parkings', 'manage_parkings']),
    parkingController.getSelectableParkingFacilities
);


router.post('/',
    checkRole(RoleName.ADMIN),
    checkPermission('manage_parkings'),
    parkingController.createParkingFacility
);

router.get('/:id',
    checkRole(RoleName.ADMIN),
    checkPermission('manage_parkings'),
    parkingController.getParkingFacilityById
);

router.put('/:id',
    checkRole(RoleName.ADMIN),
    checkPermission('manage_parkings'),
    parkingController.updateParkingFacility
);

router.delete('/:id',
    checkRole(RoleName.ADMIN),
    checkPermission('manage_parkings'),
    parkingController.deleteParkingFacility
);

module.exports = router;