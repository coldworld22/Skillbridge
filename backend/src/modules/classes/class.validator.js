const { z } = require("zod");

const toNumber = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val.trim() !== '') return parseFloat(val);
  return undefined;
};

exports.create = z.object({
  body: z.object({
    instructor_id: z.string().uuid(),
    title: z.string().min(3).max(255),
    description: z.string().optional(),
    level: z.string().optional(),
    cover_image: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    category_id: z.string().uuid().optional(),
    price: z.preprocess(toNumber, z.number().optional()),
    max_students: z.preprocess(toNumber, z.number().int().optional()),
    language: z.string().optional(),
    demo_video_url: z.string().optional(),
    allow_installments: z.preprocess(
      (v) => (typeof v === 'string' ? v === 'true' : v),
      z.boolean().optional()
    ),
    tags: z.string().optional(),
    slug: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
  })
});

exports.update = z.object({
  body: z.object({
    instructor_id: z.string().uuid().optional(),
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional(),
    level: z.string().optional(),
    cover_image: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    category_id: z.string().uuid().optional(),
    price: z.preprocess(toNumber, z.number().optional()),
    max_students: z.preprocess(toNumber, z.number().int().optional()),
    language: z.string().optional(),
    demo_video_url: z.string().optional(),
    allow_installments: z.preprocess(
      (v) => (typeof v === 'string' ? v === 'true' : v),
      z.boolean().optional()
    ),
    tags: z.string().optional(),
    slug: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
  })
});

exports.reject = z.object({
  body: z.object({
    reason: z.string().min(3)
  })
});
