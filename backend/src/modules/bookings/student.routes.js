const router = require("express").Router();
const controller = require("./bookings.controller");
const { verifyToken, isStudent } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isStudent);

router.post("/", controller.createBookingAsStudent);
router.get("/", controller.getStudentBookings);
router.patch("/:id", controller.updateBooking);

module.exports = router;
