const router = require("express").Router();
const controller = require("./subscriptions.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken);
router.get("/me", controller.getMySubscriptions);
router.post("/", controller.createOrRenewSubscription);

module.exports = router;
