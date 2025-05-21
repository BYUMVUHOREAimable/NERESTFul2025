
const express = require('express');
const router = express.Router();
const vehicleEntryController = require('../controllers/vehicleEntry.controller');
const { authenticateToken, checkRole, checkPermission, checkAnyPermission } = require('../middleware/auth');
const { RoleName } = require('@prisma/client');


router.post('/enter', authenticateToken,
    checkAnyPermission(['record_vehicle_entry']), 
    vehicleEntryController.recordVehicleEntry
);

router.get('/:entryId/entry-ticket',
    vehicleEntryController.downloadEntryTicket
);


router.post('/:vehicleEntryId/exit',
    authenticateToken,
    checkAnyPermission(['record_vehicle_exit']),
    vehicleEntryController.recordVehicleExit
);

router.get('/:entryId/exit-bill',
    vehicleEntryController.downloadExitBill
);
router.get('/',
    authenticateToken,
    checkAnyPermission(['view_current_parked_vehicles', 'view_all_vehicle_entries']),
    vehicleEntryController.listVehicleEntries
);


module.exports = router;