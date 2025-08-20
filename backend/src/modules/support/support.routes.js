const router = require("express").Router();
const controller = require("./support.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken);

router.post("/tickets", controller.createTicket);
router.get("/my-tickets", controller.listMyTickets);
router.get("/tickets/:id", controller.getTicket);
router.post("/tickets/:id/messages", controller.addMessage);
router.delete("/tickets/:id", controller.deleteTicket);

router.get("/admin/tickets", isAdmin, controller.listAllTickets);
router.patch("/admin/tickets/:id/status", isAdmin, controller.updateStatus);
router.patch("/admin/tickets/:id/priority", isAdmin, controller.updatePriority);
router.get("/admin/recent-activity", isAdmin, controller.listRecentActivity);
router.get("/admin/analytics", isAdmin, controller.getAnalytics);

module.exports = router;
