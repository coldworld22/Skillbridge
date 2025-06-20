const router = require("express").Router();
const controller = require("./bookings.controller");
const { verifyToken, isStudent } = require("../../middleware/auth/authMiddleware");
const validate = require("../../middleware/validate");
const {
  createBookingSchema,
  updateBookingSchema,
} = require("./booking.validator");

router.use(verifyToken, isStudent);

router.post("/", validate({ body: createBookingSchema }), controller.createBookingAsStudent);
router.get("/", controller.getStudentBookings);
router.patch(
  "/:id",
  validate({ body: updateBookingSchema }),
  controller.updateBooking
);

module.exports = router;
