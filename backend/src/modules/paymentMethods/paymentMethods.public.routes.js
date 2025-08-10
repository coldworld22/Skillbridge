const express = require("express");
const router = express.Router();
const controller = require("./paymentMethods.controller");

router.get("/", controller.getActiveMethods);
router.get("/paypal/client-id", controller.getPayPalClientId);

module.exports = router;
