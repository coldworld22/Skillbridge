const express = require("express");
const router = express.Router();
const controller = require("./paymentMethods.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);

router.post("/", controller.createMethod);
router.get("/", controller.getMethods);
router.get("/:id", controller.getMethod);
router.patch("/:id", controller.updateMethod);
router.delete("/:id", controller.deleteMethod);

module.exports = router;
