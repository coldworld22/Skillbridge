const { z } = require("zod");

exports.create = {
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    due_date: z.string().datetime(),
  }),
};

exports.update = {
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    due_date: z.string().datetime().optional(),
  }),
};
