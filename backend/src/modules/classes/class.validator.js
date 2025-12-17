const { z } = require("zod");
const db = require("../../config/database");

const toNumber = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val.trim() !== '') return parseFloat(val);
  return undefined;
};

const toStringArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const validateStudentPlans = async (plans) => {
  if (!plans) return true;
  for (const p of plans) {
    let plan = await db("plans").where({ id: p }).first();
    if (!plan) {
      plan = await db("plans").where({ slug: p }).first();
    }
    if (!plan || plan.target_role !== "student") {
      return false;
    }
  }
  return true;
};

const includedPlans = z.preprocess(
  toStringArray,
  z.array(z.string()).optional()
).refine(validateStudentPlans, {
  message: "Included plans must exist and target students",
});

const requirePlansForFreeAccess = (schema) =>
  schema.refine(
    (data) =>
      data.access_type !== "free" ||
      (Array.isArray(data.included_plans) && data.included_plans.length > 0),
    {
      message: "Free classes must include at least one student plan",
      path: ["included_plans"],
    }
  );

const createSchema = requirePlansForFreeAccess(
  z
    .object({
      instructor_id: z.string().uuid().optional(),
      title: z.string().min(3).max(255),
      description: z.string().optional(),
      level: z.string().optional(),
      cover_image: z.string().optional(),
      start_date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .optional(),
      end_date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .optional(),
      category_id: z.string().uuid().optional(),
      price: z.preprocess(toNumber, z.number().optional()),
      max_students: z.preprocess(toNumber, z.number().int().optional()),
      language: z.string().optional(),
      demo_video_url: z.string().optional(),
      allow_installments: z.preprocess(
        (v) => (typeof v === "string" ? v === "true" : v),
        z.boolean().optional()
      ),
      tags: z.string().optional(),
      slug: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      access_type: z.enum(["paid", "free"]).optional(),
      included_plans: includedPlans,
    })
    .refine(
      (data) =>
        !data.start_date ||
        !data.end_date ||
        new Date(data.end_date) >= new Date(data.start_date),
      {
        message: "end_date cannot be earlier than start_date",
        path: ["end_date"],
      }
    )
);

const updateSchema = requirePlansForFreeAccess(
  z
    .object({
      title: z.string().min(3).max(255).optional(),
      description: z.string().optional(),
      level: z.string().optional(),
      cover_image: z.string().optional(),
      start_date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .optional(),
      end_date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .optional(),
      category_id: z.string().uuid().optional(),
      price: z.preprocess(toNumber, z.number().optional()),
      max_students: z.preprocess(toNumber, z.number().int().optional()),
      language: z.string().optional(),
      demo_video_url: z.string().optional(),
      allow_installments: z.preprocess(
        (v) => (typeof v === "string" ? v === "true" : v),
        z.boolean().optional()
      ),
      tags: z.string().optional(),
      slug: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      access_type: z.enum(["paid", "free"]).optional(),
      included_plans: includedPlans,
    })
    .refine(
      (data) =>
        !data.start_date ||
        !data.end_date ||
        new Date(data.end_date) >= new Date(data.start_date),
      {
        message: "end_date cannot be earlier than start_date",
        path: ["end_date"],
      }
    )
);

const adminUpdateSchema = requirePlansForFreeAccess(
  z
    .object({
      instructor_id: z.string().uuid().optional(),
      title: z.string().min(3).max(255).optional(),
      description: z.string().optional(),
      level: z.string().optional(),
      cover_image: z.string().optional(),
      start_date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .optional(),
      end_date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .optional(),
      category_id: z.string().uuid().optional(),
      price: z.preprocess(toNumber, z.number().optional()),
      max_students: z.preprocess(toNumber, z.number().int().optional()),
      language: z.string().optional(),
      demo_video_url: z.string().optional(),
      allow_installments: z.preprocess(
        (v) => (typeof v === "string" ? v === "true" : v),
        z.boolean().optional()
      ),
      tags: z.string().optional(),
      slug: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      access_type: z.enum(["paid", "free"]).optional(),
      included_plans: includedPlans,
    })
    .refine(
      (data) =>
        !data.start_date ||
        !data.end_date ||
        new Date(data.end_date) >= new Date(data.start_date),
      {
        message: "end_date cannot be earlier than start_date",
        path: ["end_date"],
      }
    )
);

exports.create = { body: createSchema };
exports.update = { body: updateSchema };
exports.adminUpdate = { body: adminUpdateSchema };

exports.reject = z.object({
  body: z.object({
    reason: z.string().min(3)
  })
});
