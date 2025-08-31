const { z } = require("zod");

exports.create = {
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    image_url: z.string().min(1).optional(),
    video_url: z.string().min(1).optional(),
    link_url: z.string().url().optional(),
    // Allow broader date formats from HTML datetime-local inputs
    start_at: z.coerce.date().optional(),
    end_at: z.coerce.date().optional(),
    target_roles: z.string().optional(),
    ad_type: z.string().optional(),
    priority: z.coerce.number().nonnegative().optional(),
    allow_branding: z.coerce.boolean().optional(),
    price: z.coerce.number().nonnegative().optional(),
  }),
};

exports.update = {
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    image_url: z.string().min(1).optional(),
    video_url: z.string().min(1).optional(),
    link_url: z.string().url().optional(),
    // Allow broader date formats from HTML datetime-local inputs
    start_at: z.coerce.date().optional(),
    end_at: z.coerce.date().optional(),
    target_roles: z.string().optional(),
    ad_type: z.string().optional(),
    priority: z.coerce.number().nonnegative().optional(),
    allow_branding: z.coerce.boolean().optional(),
    price: z.coerce.number().nonnegative().optional(),
    is_active: z.coerce.boolean().optional(),
  }),
};

exports.list = {
  query: z.object({
    role: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    type: z.string().optional(),
    search: z.string().optional(),
  }),
};
