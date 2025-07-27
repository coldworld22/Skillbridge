const router = require("express").Router();
const controller = require("./support.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken);

router.post("/tickets", controller.createTicket);
router.get("/my-tickets", controller.listMyTickets);
router.get("/tickets/:id", controller.getTicket);
router.post("/tickets/:id/messages", controller.addMessage);

router.get("/admin/tickets", isAdmin, controller.listAllTickets);
router.patch("/admin/tickets/:id/status", isAdmin, controller.updateStatus);
router.get("/admin/recent-activity", isAdmin, controller.listRecentActivity);

module.exports = router;
