const { z } = require("zod");

exports.create = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    budget: z.string().optional(),
    timeframe: z.string().optional(),
    offer_type: z.enum(["class", "tutorial"]),
    tags: z.string().optional(),
    expires_at: z.string().optional(),
    group_id: z.string().uuid(),
  }),
});

exports.update = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    budget: z.string().optional(),
    timeframe: z.string().optional(),
    tags: z.string().optional(),
    offer_type: z.enum(["class", "tutorial"]).optional(),
    status: z.enum(["open", "closed", "cancelled"]).optional(),
    expires_at: z.string().optional(),
  }),
});
