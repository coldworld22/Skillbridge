const router = require("express").Router();
const controller = require("./payments.controller");
const upload = require("./paymentReceiptUpload.middleware");
const { verifyToken, isStudent } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isStudent);

router.get("/", controller.getMyPayments);
router.post("/", controller.createPayment);
router.post("/receipts", upload.single("receipt"), controller.uploadReceipt);
router.post("/:id/confirm", controller.confirmPayment);

module.exports = router;
