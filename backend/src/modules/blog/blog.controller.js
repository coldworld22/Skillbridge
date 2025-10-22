const { v4: uuidv4 } = require("uuid");
const slugify = require("slugify");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./blog.service");

exports.createPost = catchAsync(async (req, res) => {
  const { title, excerpt, content, published_at } = req.body;
  if (!title) throw new AppError("Title is required", 400);
  const slug = slugify(title, { lower: true, strict: true });
  const existing = await service.findBySlug(slug);
  if (existing && existing.id && existing.id !== req.body.id) {
    throw new AppError("Post slug already exists", 409);
  }

  const post = await service.createPost({
    id: uuidv4(),
    title,
    slug,
    excerpt: excerpt || null,
    content: content || null,
    published_at: published_at || new Date(),
    image_url: req.file ? `/uploads/blog/${req.file.filename}` : null,
  });

  sendSuccess(res, post, "Post created");
});

exports.getPosts = catchAsync(async (_req, res) => {
  const posts = await service.getPosts();
  sendSuccess(res, posts);
});

exports.getPost = catchAsync(async (req, res) => {
  const post = await service.getPostById(req.params.id);
  if (!post) throw new AppError("Post not found", 404);
  sendSuccess(res, post);
});

exports.getPostBySlug = catchAsync(async (req, res) => {
  const post = await service.findBySlug(req.params.slug);
  if (!post) throw new AppError("Post not found", 404);
  sendSuccess(res, post);
});

exports.updatePost = catchAsync(async (req, res) => {
  const { id } = req.params;
  const existing = await service.getPostById(id);
  if (!existing) throw new AppError("Post not found", 404);

  const { title, excerpt, content, published_at } = req.body;
  const updates = { excerpt, content, published_at };

  if (title) {
    const slug = slugify(title, { lower: true, strict: true });
    const slugExist = await service.findBySlug(slug);
    if (slugExist && slugExist.id !== id) throw new AppError("Post slug already exists", 409);
    updates.title = title;
    updates.slug = slug;
  }

  if (req.file) updates.image_url = `/uploads/blog/${req.file.filename}`;

  const updated = await service.updatePost(id, updates);
  sendSuccess(res, updated, "Post updated");
});

exports.deletePost = catchAsync(async (req, res) => {
  const count = await service.deletePost(req.params.id);
  if (!count) throw new AppError("Post not found", 404);
  sendSuccess(res, null, "Post deleted");
});
