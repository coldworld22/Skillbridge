const { z } = require("zod");

const emptyToUndefined = (v) => (v === "" || v === null ? undefined : v);

exports.create = {
  body: z.object({
    title: z.string().min(3),
    description: z.preprocess(emptyToUndefined, z.string().optional()),
    image_url: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    video_url: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    link_url: z.preprocess(emptyToUndefined, z.string().url().optional()),
    start_at: z.preprocess(emptyToUndefined, z.string().datetime().optional()),
    end_at: z.preprocess(emptyToUndefined, z.string().datetime().optional()),
    target_roles: z.preprocess(emptyToUndefined, z.string().optional()),
    ad_type: z.preprocess(emptyToUndefined, z.string().optional()),
    priority: z.coerce.number().optional(),
    allow_branding: z.coerce.boolean().optional(),
  }),
};
