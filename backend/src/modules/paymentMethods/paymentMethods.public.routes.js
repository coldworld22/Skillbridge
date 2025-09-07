const express = require("express");
const router = express.Router();
const controller = require("./paymentMethods.controller");

router.get("/", controller.getActiveMethods);
router.get("/paypal/client-id", controller.getPayPalClientId);
router.get("/stripe/public-key", controller.getStripePublicKey);
router.get("/coinbase/api-key", controller.getCoinbaseApiKey);

module.exports = router;
