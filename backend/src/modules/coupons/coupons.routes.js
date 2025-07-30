const express = require("express");
const router = express.Router();
const controller = require("./coupons.controller");
const validate = require("../../middleware/validate");
const { verifyToken, isInstructorOrAdmin } = require("../../middleware/auth/authMiddleware");
const validator = require("./coupons.validator");

router.post("/admin", verifyToken, isInstructorOrAdmin, validate(validator.create), controller.createCoupon);
router.get("/admin", verifyToken, isInstructorOrAdmin, controller.getCoupons);
router.get("/admin/:id", verifyToken, isInstructorOrAdmin, controller.getCoupon);
router.put("/admin/:id", verifyToken, isInstructorOrAdmin, validate(validator.update), controller.updateCoupon);
router.delete("/admin/:id", verifyToken, isInstructorOrAdmin, controller.deleteCoupon);

router.get("/code/:code", controller.validateCode);

module.exports = router;
