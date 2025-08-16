const express = require("express");
const router = express.Router();
const controller = require("./bank.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.post("/:id/approve", verifyToken, isAdmin, controller.approveBankPayment);
router.post("/:id/reject", verifyToken, isAdmin, controller.rejectBankPayment);

module.exports = router;
