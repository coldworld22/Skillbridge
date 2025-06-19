const router = require("express").Router();
const controller = require("./bookings.controller");
const { verifyToken, isInstructor } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isInstructor);

router.get("/", controller.getInstructorBookings);
router.patch("/:id", controller.updateBooking);

module.exports = router;
