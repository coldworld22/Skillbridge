const { z } = require("zod");

const percentSchema = z.coerce.number().int().min(1).max(100);
const usageLimitSchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (val === "" || val === null || typeof val === "undefined") return undefined;
    const parsed = Number(val);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  .optional()
  .refine((val) => val === undefined || (Number.isInteger(val) && val > 0), {
    message: "Usage limit must be a positive integer",
  });

const baseFields = {
  discount_percent: percentSchema,
  starts_at: z.string().optional(),
  expires_at: z.string().optional(),
  usage_limit: usageLimitSchema,
  applies_to: z.enum(["tutorial", "class", "plan", "book"]).optional(),
  applies_to_id: z.string().uuid().optional(),
};

exports.create = z.object({
  body: z.object({
    code: z
      .string()
      .trim()
      .min(3)
      .transform((val) => val.toUpperCase()),
    ...baseFields,
    instructor_id: z.string().uuid().optional(),
  }),
});

exports.update = z.object({
  body: z
    .object({
      code: z
        .string()
        .trim()
        .min(3)
        .transform((val) => val.toUpperCase())
        .optional(),
      ...baseFields,
    })
    .partial(),
});
