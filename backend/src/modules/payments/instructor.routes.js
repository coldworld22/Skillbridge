const express = require("express");
const router = express.Router();
const controller = require("./instructor.controller");
const {
  verifyToken,
  isInstructor,
} = require("../../middleware/auth/authMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
} = require("../../middleware/tenant");

router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructor,
);

router.get("/summary", controller.getSummary);
router.get("/", controller.getPayments);

module.exports = router;
