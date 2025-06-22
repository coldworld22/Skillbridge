const { z } = require("zod");

exports.create = z.object({
  body: z.object({
    instructor_id: z.string().uuid(),
    title: z.string().min(3).max(255),
    description: z.string().optional(),
    level: z.string().optional(),
    cover_image: z.string().url().max(255).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    category_id: z.string().uuid().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
  })
});

exports.update = z.object({
  body: z.object({
    instructor_id: z.string().uuid().optional(),
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional(),
    level: z.string().optional(),
    cover_image: z.string().url().max(255).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    category_id: z.string().uuid().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
  })
});
