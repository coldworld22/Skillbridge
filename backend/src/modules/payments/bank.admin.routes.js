const express = require("express");
const router = express.Router();
const controller = require("./bank.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

// Protect all admin bank routes
router.use(verifyToken, isAdmin);

// Admin can confirm a bank payment
router.post("/confirm", controller.confirmBankPayment);

module.exports = router;
