// 📁 modules/users/usersmanagment/users.validator.js
const { z } = require("zod");

exports.statusSchema = z.object({
  status: z.enum(["pending", "active"]),
});

exports.bulkStatusSchema = z.object({
  ids: z.array(z.string().uuid()),
  status: z.enum(["pending", "active"]),
});


exports.roleSchema = z.object({
  role: z.enum(["admin", "superadmin", "instructor", "student"]),
});


exports.avatarSchema = z.object({
  avatar_url: z.string().url("Invalid avatar URL"),
});

// ✅ Add at the end of users.validator.js

exports.createUserSchema = z.object({
  full_name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8), // ✅ Still called "password" for frontend clarity
  role: z.enum(["admin", "superadmin", "instructor", "student"]),
});


exports.partialUpdateSchema = z.object({
  full_name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
  date_of_birth: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: "Invalid date format" }
  ).optional()
});





exports.bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "At least one user ID is required"),
});

exports.partialUpdateSchema = z.object({
  full_name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
  date_of_birth: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: "Invalid date format" }
  ).optional()

});

exports.passwordSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters"),
});
