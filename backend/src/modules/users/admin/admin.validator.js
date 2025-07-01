const { z } = require("zod");

exports.adminProfileSchema = z
  .object({
    full_name: z.string().min(3).optional(),
    phone: z.string().min(8).optional(),
    gender: z.string().min(1).optional(), // ✅ Added
    date_of_birth: z.string().min(4).optional(), // ✅ Added
    avatar_url: z.string().optional(), // ✅ Added (since PATCH is separate)
    job_title: z.string().min(2).optional(),
    department: z.string().min(2).optional(),
    social_links: z
      .array(
        z.object({
          platform: z.string().min(2),
          url: z.string().url(),
        })
      )
      .optional(), // ✅ Added
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No profile fields provided",
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


