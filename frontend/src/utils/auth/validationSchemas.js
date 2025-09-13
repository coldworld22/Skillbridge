// 📁 src/utils/validationSchemas.js
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

// Default country for phone validation
const DEFAULT_COUNTRY = "US";
// These helpers generate validation schemas using i18n translations
// 🔐 Login Schema
export const loginSchema = (t) =>
  z.object({
    email: z.string().email({ message: t("invalid_email_address") }),
    password: z
      .string()
      .min(6, { message: t("password_min_6_characters") }),
    recaptchaToken: z.string().optional(),
  });

// 🧾 Register Schema
export const registerSchema = (t) =>
  z
    .object({
      full_name: z.string().min(3, t("name_min_3_characters")),
      email: z.string().email(t("invalid_email_address")),
      phone: z
        .string()
        .refine((val) => isValidPhoneNumber(val, DEFAULT_COUNTRY), {
          message: t("invalid_phone_number"),
        }),

      password: z
        .string()
        .min(8, t("password_min_8_characters"))
        .regex(/[A-Z]/, t("password_must_contain_uppercase"))
        .regex(/[\W_]/, t("password_must_contain_special")),
      confirmPassword: z.string().min(1, t("confirm_password_required")),
      role: z.enum(["Student", "Instructor", "Admin"]),
      recaptchaToken: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwords_do_not_match"),
      path: ["confirmPassword"],
    });

// 🔢 OTP Verification Schema
export const otpSchema = (t) =>
  z.object({
    code: z
      .string()
      .length(6, t("otp_exactly_6_digits"))
      .regex(/^\d{6}$/, t("otp_numeric")),
  });

// 🔐 Password Reset Schema
export const resetPasswordSchema = (t) =>
  z.object({
    email: z.string().email(t("invalid_email_address")),
    code: z
      .string()
      .length(6, t("code_must_be_6_digits"))
      .regex(/^\d{6}$/, t("code_must_be_numeric")),
    new_password: z
      .string()
      .min(8, t("password_min_8_characters"))
      .regex(/[A-Z]/, t("must_include_uppercase"))
      .regex(/[\W_]/, t("must_include_special_char")),
  });
