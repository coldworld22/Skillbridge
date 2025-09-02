const router = require("express").Router();
const controller = require("./payments.controller");
const upload = require("./paymentReceiptUpload.middleware");
const { verifyToken, isStudent } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isStudent);

router.get("/", controller.getMyPayments);
router.get("/:id", controller.getMyPayment);
router.post("/", controller.createPayment);
router.post(
  "/receipts",
  (req, res, next) => {
    upload.single("receipt")(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  controller.uploadReceipt
);
router.post("/:id/confirm", controller.confirmPayment);

module.exports = router;
