const { z } = require("zod");

exports.create = {
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    image_url: z.string().min(1).optional(),
    video_url: z.string().min(1).optional(),
    link_url: z.string().url().optional(),
    start_at: z.string().datetime().optional(),
    end_at: z.string().datetime().optional(),
    target_roles: z.string().optional(),
    ad_type: z.string().optional(),
    priority: z.coerce.number().optional(),
    allow_branding: z.coerce.boolean().optional(),
  }),
};
