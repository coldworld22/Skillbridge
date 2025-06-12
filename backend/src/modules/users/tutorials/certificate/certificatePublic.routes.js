const router = require("express").Router();
const ctrl = require("./certificatePublic.controller");

// Publicly accessible
router.get("/:code", ctrl.verifyByCode);

module.exports = router;
