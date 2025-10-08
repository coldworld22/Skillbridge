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

module.exports = {
  updateStudentProfileSchema,
};
