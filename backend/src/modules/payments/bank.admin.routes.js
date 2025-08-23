const express = require("express");
const router = express.Router();
const controller = require("./bank.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
router.use(verifyToken, isAdmin);

router.get("/", controller.getBankPayments);
router.post("/:id/approve", controller.approveBankPayment);
router.post("/:id/reject", controller.rejectBankPayment);

module.exports = router;
