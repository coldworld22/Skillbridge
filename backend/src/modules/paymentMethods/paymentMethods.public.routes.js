const express = require("express");
const router = express.Router();
const controller = require("./paymentMethods.controller");

router.get("/", controller.getActiveMethods);

module.exports = router;
