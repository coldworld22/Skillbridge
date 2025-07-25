const router = require("express").Router();
const controller = require("./instructor.controller");

router.get("/", controller.list);
// More specific routes should be defined before parameterized ones
router.get("/:id/availability", controller.getAvailability);
router.get("/:id", controller.getById);

module.exports = router;
