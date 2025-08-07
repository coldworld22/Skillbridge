const service = require("./book.service");
const tagService = require("./bookTag.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const slugify = require("slugify");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const mailService = require("../../services/mailService");

exports.createBook = catchAsync(async (req, res) => {
  const { tags: rawTags, ...body } = req.body || {};
  const data = {
    title: body.title,
    short_description: body.short_description,
    detailed_description: body.detailed_description,
    price: body.price,
    language: body.language,
    license_type: body.license_type,
    category_id: body.category_id,
    instructor_id: req.user.id,
    status: "pending",
    allow_preview:
      body.allow_preview === "1" ||
      body.allow_preview === 1 ||
      body.allow_preview === true ||
      body.allow_preview === "true",
  };
  if (req.files?.cover_image?.[0])
    data.cover_image_url =
      "/uploads/books/" + req.files.cover_image[0].filename;
  if (req.files?.book_file?.[0])
    data.pdf_url = "/uploads/books/" + req.files.book_file[0].filename;
  if (req.files?.preview_pages?.length) {
    data.preview_pages = JSON.stringify(
      req.files.preview_pages.map((f) => "/uploads/books/" + f.filename)
    );
  }

  const book = await service.createBook(data);

  let tags = [];
  if (rawTags) {
    try {
      tags = typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
      if (!Array.isArray(tags)) tags = [];
    } catch {
      tags = [];
    }
  }
  if (tags.length) {
    const tagIds = [];
    for (const name of tags) {
      const existing = await tagService.findByName(name);
      const tag =
        existing ||
        (await tagService.createTag({
          name,
          slug: slugify(name, { lower: true, strict: true }),
        }));
      tagIds.push(tag.id);
    }
    await service.addBookTags(book.id, tagIds);
    book.tags = await service.getBookTags(book.id);
  } else {
    book.tags = [];
  }

  const message =
    "Your book was submitted successfully and is under review.";
  await Promise.all([
    notificationService.createNotification({
      user_id: req.user.id,
      type: "book_submitted",
      message,
    }),
    messageService.createMessage({
      sender_id: req.user.id,
      receiver_id: req.user.id,
      message,
    }),
    req.user.email
      ? mailService.sendMail({
          to: req.user.email,
          subject: "Book submitted for review",
          html: `<p>${message} We will notify you when it is published.</p>`,
        })
      : Promise.resolve(),
  ]);

  sendSuccess(res, book, "Book submitted for review");
});

exports.listBooks = catchAsync(async (req, res) => {
  const result = await service.listBooks(req.query);
  sendSuccess(res, result.data, "Books fetched", result.meta);
});

exports.getBook = catchAsync(async (req, res) => {
  const book = await service.getBookById(req.params.id);
  if (!book || book.status !== "approved") {
    throw new AppError("Book not found", 404);
  }
  sendSuccess(res, book);
});

exports.getBookAdmin = catchAsync(async (req, res) => {
  const book = await service.getBookById(req.params.id);
  if (!book) {
    throw new AppError("Book not found", 404);
  }
  book.tags = await service.getBookTags(book.id);
  sendSuccess(res, book);
});

exports.updateBook = catchAsync(async (req, res) => {
  const existing = await service.getBookById(req.params.id);
  if (!existing) throw new AppError("Book not found", 404);

  const { tags: rawTags, ...body } = req.body || {};
  const data = { ...body };
  if (req.files?.cover_image?.[0])
    data.cover_image_url =
      "/uploads/books/" + req.files.cover_image[0].filename;
  if (req.files?.book_file?.[0])
    data.pdf_url = "/uploads/books/" + req.files.book_file[0].filename;
  if (req.files?.preview_pages?.length) {
    data.preview_pages = JSON.stringify(
      req.files.preview_pages.map((f) => "/uploads/books/" + f.filename)
    );
  }
  if (data.allow_preview !== undefined) {
    data.allow_preview =
      data.allow_preview === "1" ||
      data.allow_preview === 1 ||
      data.allow_preview === true ||
      data.allow_preview === "true";
  }

  const book = await service.updateBook(req.params.id, data);

  let tags = [];
  if (rawTags) {
    try {
      tags = typeof rawTags === "string" ? JSON.parse(rawTags) : rawTags;
      if (!Array.isArray(tags)) tags = [];
    } catch {
      tags = [];
    }
  }
  await service.clearBookTags(book.id);
  if (tags.length) {
    const tagIds = [];
    for (const name of tags) {
      const existingTag = await tagService.findByName(name);
      const tag =
        existingTag ||
        (await tagService.createTag({
          name,
          slug: slugify(name, { lower: true, strict: true }),
        }));
      tagIds.push(tag.id);
    }
    await service.addBookTags(book.id, tagIds);
    book.tags = await service.getBookTags(book.id);
  } else {
    book.tags = [];
  }

  if (
    req.user.role !== "instructor" &&
    existing.instructor_id &&
    existing.instructor_id !== req.user.id
  ) {
    const message = `Your book "${book.title}" was updated by an admin.`;
    await Promise.all([
      notificationService.createNotification({
        user_id: existing.instructor_id,
        type: "book_updated",
        message,
      }),
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: existing.instructor_id,
        message,
      }),
    ]);
  }

  sendSuccess(res, book, "Book updated");
});

exports.deleteBook = catchAsync(async (req, res) => {
  await service.clearBookTags(req.params.id);
  await service.deleteBook(req.params.id);
  sendSuccess(res, null, "Book deleted");
});

exports.updateBookStatus = catchAsync(async (req, res) => {
  const { status } = req.body || {};
  const book = await service.updateBookStatus(req.params.id, status);
  if (!book) {
    throw new AppError("Book not found", 404);
  }
  sendSuccess(res, book, "Book status updated");
});

exports.listInstructorBooks = catchAsync(async (req, res) => {
  const result = await service.listBooks({
    ...req.query,
    instructorId: req.user.id,
  });
  sendSuccess(res, result.data, "Books fetched", result.meta);
});

exports.getBookAnalytics = catchAsync(async (req, res) => {
  const stats = await service.getInstructorBookAnalytics(req.user.id);
  sendSuccess(res, stats, "Analytics fetched");
});
