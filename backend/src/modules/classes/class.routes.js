const express = require("express");
const router = express.Router();
const controller = require("./class.controller");
const validate = require("../../middleware/validate");
const validator = require("./class.validator");

router.post("/admin", validate(validator.create), controller.createClass);
router.get("/admin", controller.getAllClasses);
router.get("/admin/:id", controller.getClassById);
router.put("/admin/:id", validate(validator.update), controller.updateClass);
router.delete("/admin/:id", controller.deleteClass);

router.get("/", controller.getPublishedClasses);
router.get("/:id", controller.getPublicClassDetails);

module.exports = router;
