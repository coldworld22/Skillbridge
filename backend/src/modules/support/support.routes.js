const router = require("express").Router();
const controller = require("./support.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/support_attachments" });

router.use(verifyToken);

router.post("/tickets", controller.createTicket);
router.get("/my-tickets", controller.listMyTickets);
router.get("/tickets/:id", controller.getTicket);
router.post("/tickets/:id/messages", controller.addMessage);
router.delete("/tickets/:id", controller.deleteTicket);
router.post(
  "/messages/:messageId/attachments",
  upload.single("file"),
  controller.uploadAttachment
);

router.get("/admin/tickets", isAdmin, controller.listAllTickets);
router.patch("/admin/tickets/:id/status", isAdmin, controller.updateStatus);
router.get("/admin/recent-activity", isAdmin, controller.listRecentActivity);
router.get("/admin/analytics", isAdmin, controller.getAnalytics);

module.exports = router;
