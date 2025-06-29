const { z } = require("zod");

exports.create = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    budget: z.string().optional(),
    timeframe: z.string().optional(),
    tags: z.string().optional(),
  }),
});

exports.update = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    budget: z.string().optional(),
    timeframe: z.string().optional(),
    tags: z.string().optional(),
    status: z.enum(["open", "closed", "cancelled"]).optional(),
  }),
});
