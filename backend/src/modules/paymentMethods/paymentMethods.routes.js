const express = require("express");
const router = express.Router();
const controller = require("./paymentMethods.controller");
const {
  verifyToken,
  isAdmin,
} = require("../../middleware/auth/authMiddleware");
const upload = require("./paymentMethodIconUploadMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../middleware/storage");

router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("config.payment_methods.manage"),
  isAdmin,
);

router.post(
  "/",
  upload.single("icon"),
  checkAndConsumeStorage(),
  controller.createMethod,
);
router.get("/", controller.getMethods);
router.get("/paypal/credentials", controller.getPayPalCredentials);
router.put("/paypal/credentials", controller.updatePayPalCredentials);
router.get("/stripe/credentials", controller.getStripeCredentials);
router.put("/stripe/credentials", controller.updateStripeCredentials);
router.get("/coinbase/credentials", controller.getCoinbaseCredentials);
router.put("/coinbase/credentials", controller.updateCoinbaseCredentials);
router.get("/:id", controller.getMethod);
router.patch(
  "/:id",
  upload.single("icon"),
  checkAndConsumeStorage(),
  controller.updateMethod,
);
router.delete("/:id", controller.deleteMethod);

module.exports = router;
