const { z } = require("zod");

const STATUS_ENUM = ["pending", "approved", "declined", "cancelled", "completed"];

exports.createBookingSchema = z.object({
  student_id: z.string().uuid(),
  instructor_id: z.string().uuid(),
  start_time: z.string(),
  end_time: z.string(),
  notes: z.string().optional(),
  status: z.enum(STATUS_ENUM).optional(),
});

exports.updateBookingSchema = z.object({
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(STATUS_ENUM).optional(),
});
