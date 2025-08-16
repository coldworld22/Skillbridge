const router = require("express").Router();
const controller = require("./bank.controller");
const { verifyToken, isStudent } = require("../../middleware/auth/authMiddleware");

// Student must be authenticated
router.use(verifyToken, isStudent);

// Initiate a bank payment for an order
router.post("/initiate", controller.initiateBankPayment);

module.exports = router;
