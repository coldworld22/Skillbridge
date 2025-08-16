const router = require("express").Router();
const controller = require("./bank.controller");
const upload = require("./paymentReceiptUpload.middleware");
const { verifyToken, isStudent } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isStudent);

router.post("/confirm", upload.single("receiptFile"), controller.confirmBankPayment);

module.exports = router;
