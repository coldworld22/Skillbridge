const express = require("express");
const router = express.Router();
const controller = require("./ads.controller");
const validate = require("../../middleware/validate");
const { verifyToken, isInstructorOrAdmin } = require("../../middleware/auth/authMiddleware");
const validator = require("./ads.validator");

router.post("/admin", verifyToken, isInstructorOrAdmin, validate(validator.create), controller.createAd);
router.get("/", controller.getAds);
router.get("/:id", controller.getAdById);

module.exports = router;
