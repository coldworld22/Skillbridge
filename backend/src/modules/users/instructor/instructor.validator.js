const { z } = require("zod");

// 🔹 Instructor Profile Update Schema
const updateInstructorProfileSchema = z.object({
  full_name: z.string().trim().min(3, "Full name is required"),
  phone: z.string().trim().min(8, "Phone number is required"),

  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date of birth",
  }),

  expertise: z.array(z.string().trim()).optional().nullable(),

  experience: z
    .union([z.number(), z.string().regex(/^\d+$/, "Must be a number")])
    .transform((val) => Number(val))
    .optional()
    .nullable(),
  bio: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || val.split(/\s+/).filter(Boolean).length <= 150, {
      message: "Bio must be 150 words or fewer",
    }),

  certifications: z.string().trim().optional().nullable(),
  availability: z.string().trim().optional().nullable(),
  pricing: z.string().trim().optional().nullable(),

  demo_video_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .nullable(),

  social_links: z
    .array(
      z.object({
        platform: z.string().min(2),
        url: z.string().url("Must be a valid URL"),
      })
    )
    .optional()
    .nullable(),
});

// 🔹 Certificate Upload Schema (for validation middleware if needed)
const uploadCertificateSchema = z.object({
  title: z.string().min(2, "Certificate title is required"),
  // The actual file is handled via multer, but this can validate accompanying fields
});

module.exports = {
  updateInstructorProfileSchema,
  uploadCertificateSchema,
};
