/**
 * Validation schemas for admin categories
 * See docs/admin-category-management.md
 */
const { z } = require("zod");

exports.createCategorySchema = z.object({
  name: z.string().min(2),
  status: z.enum(["active", "inactive"]).default("active"),
  parent_id: z.string().uuid().nullable().optional()
});
