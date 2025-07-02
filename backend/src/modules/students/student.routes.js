const router = require("express").Router();
const controller = require("./student.controller");

router.get("/", controller.list);
router.get("/:id", controller.getById);

module.exports = router;
