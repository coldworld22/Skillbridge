const express = require("express");
const router = express.Router();
const controller = require("./verify.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

// Send OTP
router.post("/email/send", verifyToken, controller.sendEmailOtp);
router.post("/phone/send", verifyToken, controller.sendPhoneOtp);

// Verify OTP
router.post("/email/confirm", verifyToken, controller.verifyEmailOtp);
router.post("/phone/confirm", verifyToken, controller.verifyPhoneOtp);

module.exports = router;
