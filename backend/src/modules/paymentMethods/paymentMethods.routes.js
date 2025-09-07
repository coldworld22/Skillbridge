const express = require("express");
const router = express.Router();
const controller = require("./paymentMethods.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
const upload = require("./paymentMethodIconUploadMiddleware");

router.use(verifyToken, isAdmin);

router.post("/", upload.single("icon"), controller.createMethod);
router.get("/", controller.getMethods);
router.get("/paypal/credentials", controller.getPayPalCredentials);
router.put("/paypal/credentials", controller.updatePayPalCredentials);
router.get("/stripe/credentials", controller.getStripeCredentials);
router.put("/stripe/credentials", controller.updateStripeCredentials);
router.get("/coinbase/credentials", controller.getCoinbaseCredentials);
router.put("/coinbase/credentials", controller.updateCoinbaseCredentials);
router.get("/:id", controller.getMethod);
router.patch("/:id", upload.single("icon"), controller.updateMethod);
router.delete("/:id", controller.deleteMethod);

module.exports = router;
