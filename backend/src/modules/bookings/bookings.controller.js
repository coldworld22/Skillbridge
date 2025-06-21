const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./bookings.service");
const { v4: uuidv4 } = require("uuid");

exports.createBooking = catchAsync(async (req, res) => {
  const { student_id, instructor_id, start_time, end_time, notes, status } = req.body;
  if (!student_id || !instructor_id || !start_time || !end_time) {
    throw new AppError("Missing required fields", 400);
  }
  const booking = await service.create({
    id: uuidv4(),
    student_id,
    instructor_id,
    start_time,
    end_time,
    notes,
    status: status || "pending",
  });
  sendSuccess(res, booking, "Booking created");
});

exports.getBookings = catchAsync(async (_req, res) => {
  const data = await service.getAll();
  sendSuccess(res, data);
});

exports.getBooking = catchAsync(async (req, res) => {
  const booking = await service.getById(req.params.id);
  if (!booking) throw new AppError("Booking not found", 404);
  sendSuccess(res, booking);
});

exports.updateBooking = catchAsync(async (req, res) => {
  const booking = await service.update(req.params.id, req.body);
  if (!booking) throw new AppError("Booking not found", 404);
  sendSuccess(res, booking, "Booking updated");
});

// Student: create a booking for themselves
exports.createBookingAsStudent = catchAsync(async (req, res) => {
  const { instructor_id, start_time, end_time, notes } = req.body;
  if (!instructor_id || !start_time || !end_time) {
    throw new AppError("Missing required fields", 400);
  }
  const booking = await service.create({
    id: uuidv4(),
    student_id: req.user.id,
    instructor_id,
    start_time,
    end_time,
    notes,
    status: "pending",
  });
  sendSuccess(res, booking, "Booking created");
});

// Get bookings for logged in student
exports.getStudentBookings = catchAsync(async (req, res) => {
  const data = await service.getByStudent(req.user.id);
  sendSuccess(res, data);
});

// Get bookings for logged in instructor
exports.getInstructorBookings = catchAsync(async (req, res) => {
  const data = await service.getByInstructor(req.user.id);
  sendSuccess(res, data);
});

// Delete a booking belonging to the logged in student
exports.deleteStudentBooking = catchAsync(async (req, res) => {
  const booking = await service.getById(req.params.id);
  if (!booking || booking.student_id !== req.user.id) {
    throw new AppError("Booking not found", 404);
  }
  await service.delete(req.params.id);
  sendSuccess(res, null, "Booking deleted");
});

exports.deleteBooking = catchAsync(async (req, res) => {
  await service.delete(req.params.id);
  sendSuccess(res, null, "Booking deleted");
});
