/**
 * Admin Category Management controller
 * See docs/admin-category-management.md
 */
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const service = require("./category.service");
const { sendSuccess } = require("../../../utils/response");
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const ALLOWED_STATUSES = ["active", "inactive"];


// Create category
exports.createCategory = catchAsync(async (req, res) => {
  const { name, parent_id, status = "active", icon } = req.body;

  if (!name || name.trim().length < 2) throw new AppError("Name must be at least 2 chars", 400);
  if (!ALLOWED_STATUSES.includes(status)) throw new AppError("Invalid status", 400);

  if (parent_id) {
    const parent = await service.findById(parent_id);
    if (!parent) throw new AppError("Parent not found", 404);
  }

  const exists = await service.exists({ name, parent_id });
  if (exists) throw new AppError("Duplicate under same parent", 409);

  const image_url = req.file ? `/uploads/categories/${req.file.filename}` : null;
  const slug = slugify(name, { lower: true, strict: true });
  const normalizedIcon =
    typeof icon === "string" && icon.trim().length > 0 ? icon.trim() : null;

  // Prevent duplicate slug across categories
  const slugExists = await service.findBySlug(slug);
  if (slugExists) throw new AppError("Category slug already exists", 409);

  const category = await service.create({
    id: uuidv4(),
    name: name.trim(),
    parent_id: parent_id || null,
    status,
    image_url,
    icon: normalizedIcon,
    slug,
  });

  sendSuccess(res, category, "Category created");
});

// Update category
exports.updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, parent_id, status, icon } = req.body;

  const existing = await service.findById(id);
  if (!existing) throw new AppError("Category not found", 404);

  const updates = {};

  if (name !== undefined) {
    const trimmed = name.trim();
    if (trimmed.length < 2) throw new AppError("Name must be at least 2 chars", 400);
    updates.name = trimmed;
  }

  if (status !== undefined) {
    if (!ALLOWED_STATUSES.includes(status)) throw new AppError("Invalid status", 400);
    updates.status = status;
  }

  if (parent_id !== undefined) {
    let normalizedParent = parent_id;
    if (typeof normalizedParent === "string") {
      normalizedParent = normalizedParent.trim();
      if (normalizedParent.toLowerCase() === "null" || normalizedParent === "undefined") {
        normalizedParent = null;
      }
    }
    if (!normalizedParent) {
      updates.parent_id = null;
    } else {
      if (normalizedParent === id) throw new AppError("Category cannot be its own parent", 400);
      const parent = await service.findById(normalizedParent);
      if (!parent) throw new AppError("Parent not found", 404);

      let cursor = parent;
      while (cursor) {
        if (cursor.id === id) {
          throw new AppError("Cannot assign a category to its descendant", 400);
        }
        cursor = cursor.parent_id ? await service.findById(cursor.parent_id) : null;
      }

      updates.parent_id = normalizedParent;
    }
  }

  if (icon !== undefined) {
    if (typeof icon === "string") {
      const trimmedIcon = icon.trim();
      updates.icon = trimmedIcon || null;
    } else {
      updates.icon = null;
    }
  }

  const nextName = updates.name ?? existing.name;
  const nextParent =
    updates.parent_id !== undefined ? updates.parent_id : existing.parent_id;

  if (
    (updates.name !== undefined || updates.parent_id !== undefined) &&
    (await service.exists({ name: nextName, parent_id: nextParent, excludeId: id }))
  ) {
    throw new AppError("Duplicate under same parent", 409);
  }

  if (updates.name && updates.name !== existing.name) {
    const nextSlug = slugify(updates.name, { lower: true, strict: true });
    const slugMatch = await service.findBySlug(nextSlug);
    if (slugMatch && slugMatch.id !== id) throw new AppError("Category slug already exists", 409);
    updates.slug = nextSlug;
  }

  if (req.file) {
    const newImageUrl = `/uploads/categories/${req.file.filename}`;
    if (existing.image_url) {
      const oldPath = path.join(
        __dirname,
        "../../../../",
        existing.image_url.replace(/^\//, "")
      );
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    updates.image_url = newImageUrl;
  } else if (
    updates.icon !== undefined &&
    updates.icon &&
    existing.image_url &&
    updates.icon !== existing.icon
  ) {
    const oldPath = path.join(
      __dirname,
      "../../../../",
      existing.image_url.replace(/^\//, "")
    );
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    updates.image_url = null;
  }

  if (!Object.keys(updates).length) {
    sendSuccess(res, existing, "Category unchanged");
    return;
  }

  const updated = await service.update(id, updates);

  sendSuccess(res, updated, "Category updated");
});

// Update only status
exports.updateCategoryStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!ALLOWED_STATUSES.includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const existing = await service.findById(id);
  if (!existing) throw new AppError("Category not found", 404);

  await service.updateStatus(id, status);
  sendSuccess(res, null, "Status updated");
});

// Delete category
exports.deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  const existing = await service.findById(id);
  if (!existing) throw new AppError("Category not found", 404);

  const subCount = await service.countChildren(id);
  if (subCount > 0) {
    throw new AppError("Cannot delete category with subcategories", 400);
  }

  if (existing.image_url) {
    const imgPath = path.join(
      __dirname,
      "../../../../",
      existing.image_url.replace(/^\//, "")
    );
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  await service.delete(id);
  sendSuccess(res, null, "Category deleted");
});

// Get all categories
exports.getAllCategories = catchAsync(async (req, res) => {
  const { search = "", status = "all", page = 1, limit = 10 } = req.query;
  const result = await service.getAll({ search, status, page, limit });

  sendSuccess(res, result, "Categories fetched");
});

// Get single category
exports.getCategoryById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const category = await service.findById(id);
  if (!category) throw new AppError("Category not found", 404);
  sendSuccess(res, category, "Category found");
});

// Get nested categories
exports.getNestedCategories = catchAsync(async (_req, res) => {
  const tree = await service.getNested();
  sendSuccess(res, tree, "Nested categories");
});
