const express = require("express");
const router = express.Router();
const controller = require("./googleAnalytics.controller");

router.get("/", controller.getConfig);

module.exports = router;
