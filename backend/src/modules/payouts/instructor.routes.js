const router = require("express").Router();
const controller = require("./payouts.controller");
const { verifyToken, isInstructor } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isInstructor);

router.get("/wallet", controller.getWallet);
router.post("/", controller.requestPayout);

module.exports = router;
