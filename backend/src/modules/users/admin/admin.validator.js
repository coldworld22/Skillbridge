const { z } = require("zod");

exports.adminProfileSchema = z.object({
  full_name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  gender: z.string().min(1),             // ✅ Added
  date_of_birth: z.string().min(4),      // ✅ Added
  avatar_url: z.string().optional(),     // ✅ Added (since PATCH is separate)
  job_title: z.string().min(2),
  department: z.string().min(2),
  social_links: z
    .array(
      z.object({
        platform: z.string().min(2),
        url: z.string().url(),
      })
    )
    .optional(),                         // ✅ Added
});

exports.adminChangePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
});


