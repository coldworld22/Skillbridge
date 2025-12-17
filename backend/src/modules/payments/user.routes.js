const router = require("express").Router();
const controller = require("./payments.controller");
const upload = require("./paymentReceiptUpload.middleware");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../middleware/storage");

router.use(verifyToken, resolveTenant, ensureTenantMembership());

router.post("/", controller.createPayment);
router.post(
  "/receipts",
  enforceTenantStatus(),
  requireEntitlement("payment.receipt.upload"),
  (req, res, next) => {
    upload.single("receipt")(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  checkAndConsumeStorage(),
  controller.uploadReceipt
);
router.post("/:id/confirm", controller.confirmPayment);
router.get("/", controller.getMyPayments);
router.get("/:id", controller.getMyPayment);

module.exports = router;
