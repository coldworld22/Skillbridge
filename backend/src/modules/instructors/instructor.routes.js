const router = require("express").Router();
const controller = require("./instructor.controller");

router.get("/", controller.list);
router.get("/:id", controller.getById);

module.exports = router;
