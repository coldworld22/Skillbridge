const express = require("express");
const router = express.Router();
const controller = require("./instructor.controller");
const {
  verifyToken,
  isInstructor,
} = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isInstructor);

router.get("/summary", controller.getSummary);
router.get("/", controller.getPayments);

module.exports = router;
