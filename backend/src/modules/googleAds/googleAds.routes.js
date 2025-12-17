const express = require("express");
const router = express.Router();
const controller = require("./googleAds.controller");

router.get("/", controller.getConfig);

module.exports = router;
