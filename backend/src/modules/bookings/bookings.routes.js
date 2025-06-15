const express = require("express");
const router = express.Router();
const controller = require("./bookings.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);

router.post("/", controller.createBooking);
router.get("/", controller.getBookings);
router.get("/:id", controller.getBooking);
router.patch("/:id", controller.updateBooking);
router.delete("/:id", controller.deleteBooking);

module.exports = router;
