const express = require("express");
const router = express.Router();
const controller = require("./instructorAdmin.controller");
const { verifyToken, isAdmin } = require("../../../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.patch("/:id/status", controller.updateStatus);

module.exports = router;
