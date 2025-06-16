const express = require("express");
const router = express.Router();
const controller = require("./plans.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.get("/", controller.getPlans);
router.get("/:id", controller.getPlan);
router.post("/", verifyToken, isAdmin, controller.createPlan);
router.put("/:id", verifyToken, isAdmin, controller.updatePlan);
router.delete("/:id", verifyToken, isAdmin, controller.deletePlan);

module.exports = router;
