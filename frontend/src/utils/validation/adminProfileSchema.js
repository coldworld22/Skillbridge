// 📁 src/utils/validation/adminProfileSchema.js
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

// Default country for phone validation
const DEFAULT_COUNTRY = "US";

export const adminProfileSchema = z.object({
  full_name: z.string().min(3, "Full name is required"),
  phone: z
    .string()
    .refine((val) => isValidPhoneNumber(val, DEFAULT_COUNTRY), {
      message: "Invalid phone number",
    }),
  gender: z.enum(["male", "female"]),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  avatar_url: z.any().optional(), // string or File
  job_title: z.string().min(2, "Job title is required"),
  department: z.string().min(2, "Department is required"),
  socialLinks: z
    .record(z.string().url("invalid_url"))
    .optional(), // optional dictionary { platform: url }
});
