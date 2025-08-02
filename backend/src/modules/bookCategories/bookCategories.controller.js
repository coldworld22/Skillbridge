const service = require("./bookCategories.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const slugify = require("slugify");

exports.createCategory = catchAsync(async (req, res) => {
  const data = {
    name: req.body.name,
    slug: slugify(req.body.name, { lower: true }),
    status: req.body.status || "active",
  };
  const category = await service.create(data);
  sendSuccess(res, category, "Category created");
});

exports.listCategories = catchAsync(async (_req, res) => {
  const categories = await service.list();
  sendSuccess(res, categories);
});

exports.updateCategory = catchAsync(async (req, res) => {
  const existing = await service.getById(req.params.id);
  if (!existing) throw new AppError("Category not found", 404);

  const data = { ...req.body };
  if (data.name) {
    data.slug = slugify(data.name, { lower: true });
  }
  const category = await service.update(req.params.id, data);
  sendSuccess(res, category, "Category updated");
});

exports.deleteCategory = catchAsync(async (req, res) => {
  await service.remove(req.params.id);
  sendSuccess(res, null, "Category deleted");
});
