const { z } = require("zod");

// 🔹 Full student profile update schema
const updateStudentProfileSchema = z.object({
  full_name: z.string().min(3, "Full name is required"),
  phone: z.string().min(8, "Phone number is required"),
  gender: z.enum(["male", "female"]),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date of birth",
  }),

  education_level: z.string().min(2, "Education level is required"),
  topics: z.array(z.string()).optional(),
  learning_goals: z.string().optional(),

  social_links: z
    .array(
      z.object({
        platform: z.string().min(2),
        url: z.string().url("Must be a valid URL"),
      })
    )
    .optional(),
});

const updateStudentAccountSchema = z
  .object({
    full_name: z.string().min(3, "Full name must be at least 3 characters").optional(),
    phone: z.string().min(8, "Phone number must be at least 8 digits").optional(),
    gender: z.enum(["male", "female"]).optional(),
    date_of_birth: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid date of birth",
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const updateLearningPreferencesSchema = z
  .object({
    preferred_language: z.string().min(2, "Preferred language is required").optional(),
    subtitles_enabled: z.boolean().optional(),
    subtitle_language: z.string().min(2, "Subtitle language is required").optional(),
    playback_speed: z
      .number()
      .min(0.5, "Playback speed must be at least 0.5x")
      .max(3, "Playback speed cannot exceed 3x")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const updatePrivacySettingsSchema = z
  .object({
    two_factor_enabled: z.boolean().optional(),
    data_sharing_opt_in: z.boolean().optional(),
    show_profile_publicly: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const updateUiPreferencesSchema = z
  .object({
    ui_theme: z.enum(["system", "light", "dark"]).optional(),
    ui_reduce_motion: z.boolean().optional(),
    ui_high_contrast: z.boolean().optional(),
    ui_density: z.enum(["compact", "comfortable", "spacious"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

module.exports = {
  updateStudentProfileSchema,
  updateStudentAccountSchema,
  updateLearningPreferencesSchema,
  updatePrivacySettingsSchema,
  updateUiPreferencesSchema,
};
