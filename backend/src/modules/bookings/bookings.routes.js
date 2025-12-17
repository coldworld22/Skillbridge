const express = require("express");
const router = express.Router();
const controller = require("./bookings.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");
const validate = require("../../middleware/validate");
const {
  createBookingSchema,
  updateBookingSchema,
} = require("./booking.validator");

router.use(verifyToken, isAdmin);

router.post("/", validate({ body: createBookingSchema }), controller.createBooking);
router.get("/", controller.getBookings);
router.get("/:id", controller.getBooking);
router.patch(
  "/:id",
  validate({ body: updateBookingSchema }),
  controller.updateBooking
);
router.delete("/:id", controller.deleteBooking);

module.exports = router;
