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

// Accept either a full URL (http/https) or a server-relative path
const urlOrPath = z.string().url().or(z.string().startsWith("/"));

exports.create = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    category_id: z.string(), // assuming UUID
    instructor_id: z.string().uuid().optional(),
    level: z.string(),
    language: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    price: z.preprocess(
      (val) => (val === '' || val === undefined ? undefined : Number(val)),
      z.number().nonnegative().optional()
    ),
    duration: z.preprocess(
      (val) => (val === '' || val === undefined ? undefined : parseInt(val, 10)),
      z.number().int().nonnegative().optional()
    ),
    is_paid: z.preprocess(toBoolean, z.boolean().optional()),
    included_plans: z.preprocess(parseJson, z.array(z.string()).optional()),
    tags: z.preprocess(parseJson, z.array(z.string()).optional()),
    chapters: z
      .preprocess(
        parseJson,
        z
          .array(
            z.object({
              title: z.string(),
              content: z.string().optional(),
              video_url: urlOrPath.optional(),
              duration: z.preprocess(
                (val) => (val === '' || val === undefined ? undefined : parseInt(val, 10)),
                z.number().int().nonnegative().optional()
              ),
              order: z.number(),
              is_preview: z.boolean().optional(),
            })
          )
          .optional()
      ),
    cover_image: urlOrPath.optional(),
    preview_video: urlOrPath.optional(),
  }),
});

exports.update = exports.create;

exports.reject = z.object({
  body: z.object({
    reason: z.string().min(3)
  })
});
