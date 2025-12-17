const router = require("express").Router();
const ctrl = require("./instructorCertificates.controller");
const validate = require("../../middleware/validate");
const {
  verifyToken,
  isInstructorOrAdmin,
} = require("../../middleware/auth/authMiddleware");
const validator = require("./instructorCertificates.validator");

router.use(verifyToken, isInstructorOrAdmin);

router.get("/", ctrl.list);
router.get("/:id", ctrl.getOne);
router.post("/", validate(validator.issue), ctrl.issue);
router.delete("/:id", ctrl.revoke);

module.exports = router;
