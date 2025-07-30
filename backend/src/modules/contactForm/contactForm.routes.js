const router = require("express").Router();
const controller = require("./contactForm.controller");
const validate = require("../../middleware/validate");
const validator = require("./contactForm.validator");

router.post("/", validate(validator.submit), controller.submitForm);

module.exports = router;
