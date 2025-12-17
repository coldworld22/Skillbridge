const router = require("express").Router();
const controller = require("./support.controller");
const {
  verifyToken,
  isAdmin,
} = require("../../middleware/auth/authMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/support_attachments" });
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../middleware/storage");

router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
);

router.post(
  "/tickets",
  requireEntitlement("support.ticket.create"),
  controller.createTicket,
);
router.get("/my-tickets", controller.listMyTickets);
router.get("/tickets/:id", controller.getTicket);
router.post(
  "/tickets/:id/messages",
  requireEntitlement("support.ticket.update"),
  controller.addMessage,
);
router.delete(
  "/tickets/:id",
  requireEntitlement("support.ticket.update"),
  controller.deleteTicket,
);
router.post(
  "/messages/:messageId/attachments",
  upload.single("file"),
  checkAndConsumeStorage(),
  controller.uploadAttachment,
);
router.delete(
  "/attachments/:attachmentId",
  requireEntitlement("support.ticket.update"),
  controller.deleteAttachment,
);

router.get("/admin/tickets", isAdmin, controller.listAllTickets);
router.patch(
  "/admin/tickets/:id/status",
  isAdmin,
  requireEntitlement("support.ticket.manage"),
  controller.updateStatus,
);
router.patch(
  "/admin/tickets/:id/priority",
  isAdmin,
  requireEntitlement("support.ticket.manage"),
  controller.updatePriority,
);
router.get("/admin/recent-activity", isAdmin, controller.listRecentActivity);
router.get("/admin/analytics", isAdmin, controller.getAnalytics);

module.exports = router;
