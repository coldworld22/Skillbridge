// 📁 src/utils/validationSchemas.js
import { z } from "zod";

// 🔐 Login Schema
export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  recaptchaToken: z.string().optional(),
});

// 🧾 Register Schema
export const registerSchema = z
  .object({
    full_name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(12, "Phone must be at least 12 digits").max(20, "Phone must be at most 20 digits"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[\W_]/, "Password must contain a special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["Student", "Instructor", "Admin"]),
    recaptchaToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// 🔢 OTP Verification Schema
export const otpSchema = z.object({
  email: z.string().email("Invalid email"),
  code: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

// 🔐 Password Reset Schema
export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must be numeric"),
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[\W_]/, "Must include a special character"),
});
