const express = require("express");
const router = express.Router();
const controller = require("./payouts.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);

router.post("/", controller.createPayout);
router.get("/", controller.getPayouts);
router.get("/:id", controller.getPayout);
router.patch("/:id", controller.updatePayout);
router.delete("/:id", controller.deletePayout);

module.exports = router;
