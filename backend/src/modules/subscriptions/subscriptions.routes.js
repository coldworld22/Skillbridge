const router = require("express").Router();
const controller = require("./subscriptions.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken);
router.get("/me", controller.getMySubscriptions);
router.get("/summary", controller.getMySubscriptionSummary);
router.get("/history", controller.getMySubscriptionHistory);
router.post("/", controller.createOrRenewSubscription);
router.post("/upgrade", controller.upgradeSubscription);
router.post("/cancel", controller.cancelSubscription);

module.exports = router;
