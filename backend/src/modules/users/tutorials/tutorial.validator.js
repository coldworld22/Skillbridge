const { z } = require("zod");

// Helper preprocessor for boolean values coming from multipart/form-data
const toBoolean = (val) => {
  if (typeof val === "string") return val === "true";
  return val;
};

// Helper preprocessor to safely parse JSON strings
const parseJson = (val) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (_) {
      return undefined;
    }
  }
  return val;
};

exports.create = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    category_id: z.string(), // assuming UUID
    level: z.string(),
    price: z.string().optional(),
    is_paid: z.preprocess(toBoolean, z.boolean().optional()),
    tags: z.preprocess(parseJson, z.array(z.string()).optional()),
    chapters: z
      .preprocess(
        parseJson,
        z
          .array(
            z.object({
              title: z.string(),
              content: z.string().optional(),
              video_url: z.string().url().optional(),
              order: z.number(),
              is_preview: z.boolean().optional(),
            })
          )
          .optional()
      ),
    cover_image: z.string().url().optional(),
    preview_video: z.string().url().optional(),
  }),
});

exports.update = exports.create;

exports.reject = z.object({
  body: z.object({
    reason: z.string().min(3)
  })
});
