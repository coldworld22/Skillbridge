const { z } = require("zod");

exports.create = z.object({
  body: z.object({
    code: z.string().min(3),
    discount_percent: z.number().min(1).max(100),
    starts_at: z.string().optional(),
    expires_at: z.string().optional(),
    usage_limit: z.number().min(1).optional(),
    applies_to: z.enum(["tutorial", "class", "plan", "book"]).optional(),
    applies_to_id: z.string().uuid().optional(),
    instructor_id: z.string().uuid().optional(),
  }),
});

exports.update = z.object({
  body: z.object({
    discount_percent: z.number().min(1).max(100).optional(),
    starts_at: z.string().optional(),
    expires_at: z.string().optional(),
    usage_limit: z.number().min(1).optional(),
    applies_to: z.enum(["tutorial", "class", "plan", "book"]).optional(),
    applies_to_id: z.string().uuid().optional(),
  }),
});
