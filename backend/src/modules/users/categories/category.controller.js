const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const service = require("./category.service");
const { sendSuccess } = require("../../../utils/response");
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");


// Create category
exports.createCategory = catchAsync(async (req, res) => {
  const { name, parent_id, status = "active" } = req.body;

  if (!name || name.trim().length < 2) throw new AppError("Name must be at least 2 chars", 400);
  if (!["active", "inactive"].includes(status)) throw new AppError("Invalid status", 400);

  if (parent_id) {
    const parent = await service.findById(parent_id);
    if (!parent) throw new AppError("Parent not found", 404);
  }

  const exists = await service.exists({ name, parent_id });
  if (exists) throw new AppError("Duplicate under same parent", 409);

  const image_url = req.file ? `/uploads/categories/${req.file.filename}` : null;
  const slug = slugify(name, { lower: true, strict: true });

  // Prevent duplicate slug across categories
  const slugExists = await service.findBySlug(slug);
  if (slugExists) throw new AppError("Category slug already exists", 409);

  const category = await service.create({
    id: uuidv4(),
    name: name.trim(),
    parent_id: parent_id || null,
    status,
    image_url,
    slug,
  });

  sendSuccess(res, category, "Category created");
});

// Update category
exports.updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, parent_id, status } = req.body;

  const existing = await service.findById(id);
  if (!existing) throw new AppError("Category not found", 404);

  if (req.file && existing.image_url) {
    const oldPath = path.join(__dirname, "../../../../", existing.image_url);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const image_url = req.file ? `/uploads/categories/${req.file.filename}` : existing.image_url;

  const updated = await service.update(id, {
    name: name?.trim() ?? existing.name,
    parent_id: parent_id ?? existing.parent_id,
    status: status ?? existing.status,
    image_url,
  });

  sendSuccess(res, updated, "Category updated");
});

// Update only status
exports.updateCategoryStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
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
    const imgPath = path.join(__dirname, "../../../../", existing.image_url);
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
