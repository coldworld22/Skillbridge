const router = require("express").Router();
const { resolveTenant } = require("../../middleware/tenant");
const controller = require("./search.controller");

router.get("/", resolveTenant, controller.search);

module.exports = router;
