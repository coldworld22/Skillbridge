const router = require("express").Router();
const controller = require("./payments.controller");
const upload = require("./paymentReceiptUpload.middleware");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken);

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
router.get("/", controller.getMyPayments);
router.get("/:id", controller.getMyPayment);

module.exports = router;
