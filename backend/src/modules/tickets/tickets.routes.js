const router = require("express").Router();
const controller = require("./tickets.controller");
const validate = require("../../middleware/validate");
const {
  verifyToken,
  isAdmin,
} = require("../../middleware/auth/authMiddleware");
const validation = require("./tickets.validation");
const multer = require("multer");
const upload = multer({ dest: "uploads/ticket_attachments" });
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

router.get("/", isAdmin, controller.getAllTickets);
router.get("/:id", controller.getTicketById);
router.post(
  "/",
  requireEntitlement("support.ticket.create"),
  validate(validation.createTicketSchema),
  controller.createTicket,
);
router.post(
  "/:id/reply",
  requireEntitlement("support.ticket.update"),
  validate(validation.replySchema),
  controller.addMessage,
);
router.post(
  "/:id/note",
  isAdmin,
  requireEntitlement("support.ticket.manage"),
  validate(validation.replySchema),
  controller.addNote,
);
router.put(
  "/:id/status",
  isAdmin,
  requireEntitlement("support.ticket.manage"),
  validate(validation.statusSchema),
  controller.updateStatus,
);
router.put(
  "/:id/priority",
  isAdmin,
  requireEntitlement("support.ticket.manage"),
  validate(validation.prioritySchema),
  controller.updatePriority,
);
router.put(
  "/:id/assign",
  isAdmin,
  requireEntitlement("support.ticket.manage"),
  validate(validation.assignSchema),
  controller.assignTicket,
);
router.post(
  "/:messageId/upload",
  upload.single("file"),
  checkAndConsumeStorage(),
  controller.uploadAttachment,
);
router.delete(
  "/attachments/:attachmentId",
  requireEntitlement("support.ticket.update"),
  controller.deleteAttachment,
);

module.exports = router;
