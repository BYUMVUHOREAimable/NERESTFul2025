
const express = require("express");
const router = express.Router();
const slotRequestController = require("../controllers/slotrequest.controller");
const {
  authenticateToken,
  checkRole,
  checkPermission,
  checkAnyPermission,
} = require("../middleware/auth");
const { RoleName } = require("@prisma/client");

router.use(authenticateToken);

router.post(
  "/",
  checkPermission("request_parking_slot"),
  slotRequestController.createSlotRequest
);
router.put(
  "/:id",
  checkPermission("manage_own_slot_requests"),
  slotRequestController.updateMySlotRequest
);


router.get(
  "/",
  checkAnyPermission(["list_own_slot_requests", "manage_all_slot_requests"]),
  slotRequestController.listSlotRequests
);


router.patch(
  "/:id/resolve",
  checkRole(RoleName.ADMIN),
  checkPermission("manage_all_slot_requests"),
  slotRequestController.resolveSlotRequest
);


router.get('/:id/ticket/download',
  checkAnyPermission(['manage_own_slot_requests', 'manage_all_slot_requests', 'list_own_slot_requests']),
  slotRequestController.downloadTicketPdf
);

module.exports = router;
