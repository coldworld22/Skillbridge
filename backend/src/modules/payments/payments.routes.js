const express = require("express");
const router = express.Router();
const controller = require("./payments.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);

router.post("/", controller.createPayment);
router.get("/", controller.getPayments);
router.get("/:id", controller.getPayment);
router.patch("/:id", controller.updatePayment);
router.delete("/:id", controller.deletePayment);

module.exports = router;
