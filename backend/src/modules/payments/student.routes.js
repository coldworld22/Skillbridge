const router = require("express").Router();
const controller = require("./payments.controller");
const { verifyToken, isStudent } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isStudent);

router.get("/", controller.getMyPayments);

module.exports = router;
