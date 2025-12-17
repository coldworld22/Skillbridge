const { z } = require("zod");

const budgetSchema = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) return undefined;
    const asString = String(value).trim();
    return asString.length ? asString : undefined;
  });

const tagValueSchema = z.union([
  z.string(),
  z.object({ name: z.string() }),
]);

const tagsSchema = z
  .union([z.string(), z.array(tagValueSchema)])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) return undefined;

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return JSON.stringify(parsed);
        }
      } catch (_err) {
        // fall through to treat as comma-separated/single tag
      }
      const names = trimmed
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      return JSON.stringify(names.length ? names : [trimmed]);
    }

    const names = value
      .map((tag) =>
        typeof tag === "string" ? tag : (tag?.name || "")
      )
      .map((name) => String(name).trim())
      .filter(Boolean);

    return names.length ? JSON.stringify(names) : JSON.stringify([]);
  });

const expiresAtSchema = z
  .union([z.string(), z.date()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) return undefined;
    if (value instanceof Date) {
      return value.toISOString();
    }
    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : undefined;
  });

const createBodySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  budget: budgetSchema,
  timeframe: z.string().optional(),
  offer_type: z.enum(["class", "tutorial"]),
  tags: tagsSchema,
  expires_at: expiresAtSchema,
  group_id: z.string().uuid().optional(),
});

const updateBodySchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  budget: budgetSchema,
  timeframe: z.string().optional(),
  tags: tagsSchema,
  offer_type: z.enum(["class", "tutorial"]).optional(),
  status: z.enum(["open", "closed", "cancelled"]).optional(),
  expires_at: expiresAtSchema,
});

exports.create = { body: createBodySchema };
exports.update = { body: updateBodySchema };
