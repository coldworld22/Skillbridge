const express = require("express");
const router = express.Router();
const controller = require("./contact.controller");

router.post("/", controller.submitForm);

module.exports = router;
