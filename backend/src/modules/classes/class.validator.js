const { z } = require("zod");

exports.create = z.object({
  body: z.object({
    instructor_id: z.string().uuid(),
    title: z.string().min(3),
    description: z.string().optional(),
    level: z.string().optional(),
    cover_image: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
  })
});

exports.update = z.object({
  body: z.object({
    instructor_id: z.string().uuid().optional(),
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    level: z.string().optional(),
    cover_image: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
  })
});
