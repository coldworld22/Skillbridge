const router = require("express").Router();
const controller = require("./bank.controller");
const { verifyToken, isStudent } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isStudent);

router.post("/initiate", controller.initiateBankPayment);

module.exports = router;
