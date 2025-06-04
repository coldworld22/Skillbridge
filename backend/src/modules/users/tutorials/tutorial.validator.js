const { z } = require("zod");

exports.create = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    category_id: z.string(), // assuming UUID
    level: z.string(),
    price: z.string().optional(),
    is_paid: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    chapters: z.array(z.object({
      title: z.string(),
      content: z.string().optional(),
      video_url: z.string().url().optional(),
      order: z.number()
    })).optional(),
    cover_image: z.string().url().optional(),
    preview_video: z.string().url().optional(),
  })
});

exports.update = exports.create;

exports.reject = z.object({
  body: z.object({
    reason: z.string().min(3)
  })
});
