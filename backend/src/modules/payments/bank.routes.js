const router = require("express").Router();
const controller = require("./bank.controller");
const upload = require("./paymentReceiptUpload.middleware");
const {
  verifyToken,
  isStudent,
} = require("../../middleware/auth/authMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");

router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isStudent,
);

router.post(
  "/initiate",
  requireEntitlement("payment.pay"),
  (req, res, next) => {
    upload.single("receipt")(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  controller.initiateBankPayment,
);

module.exports = router;
