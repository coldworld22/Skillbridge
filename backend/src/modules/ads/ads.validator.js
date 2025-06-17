const { z } = require("zod");

exports.create = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    image_url: z.string().min(1).optional(),
    link_url: z.string().url().optional(),
  })
});
