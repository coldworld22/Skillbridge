const router = require("express").Router();
const controller = require("./bookings.controller");
const { verifyToken, isInstructor } = require("../../middleware/auth/authMiddleware");
const validate = require("../../middleware/validate");
const { updateBookingSchema } = require("./booking.validator");

router.use(verifyToken, isInstructor);

router.get("/", controller.getInstructorBookings);
router.patch(
  "/:id",
  validate({ body: updateBookingSchema }),
  controller.updateBooking
);

module.exports = router;
