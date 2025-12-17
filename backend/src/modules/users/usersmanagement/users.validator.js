// 📁 modules/users/usersmanagment/users.validator.js
const { z } = require("zod");

const statusEnum = z.enum(["pending", "active", "inactive", "suspended"]);
const roleEnum = z.enum(["admin", "instructor", "student"]);
const genderEnum = z.enum(["male", "female", "other", "prefer-not-to-say"]);

exports.statusSchema = z.object({
  status: statusEnum,
});

exports.bulkStatusSchema = z.object({
  ids: z.array(z.string().uuid()),
  status: statusEnum,
});

exports.roleSchema = z.object({
  role: roleEnum,
});

exports.avatarSchema = z.object({
  avatar_url: z.string().url("Invalid avatar URL"),
});

exports.createUserSchema = z.object({
  full_name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8), // ✅ Still called "password" for frontend clarity
  role: roleEnum,
  gender: genderEnum.optional(),
  status: statusEnum.default("pending"),
});

exports.partialUpdateSchema = z.object({
  full_name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  gender: genderEnum.optional(),
  date_of_birth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
    .optional(),
  status: statusEnum.optional(),
});

exports.bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "At least one user ID is required"),
});

exports.passwordSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters"),
});
