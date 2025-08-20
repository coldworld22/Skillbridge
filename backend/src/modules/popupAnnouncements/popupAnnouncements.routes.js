const express = require("express");
const router = express.Router();
const controller = require("./popupAnnouncements.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.get("/active", controller.active);
router.get("/", controller.list);
router.use(verifyToken, isAdmin);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
