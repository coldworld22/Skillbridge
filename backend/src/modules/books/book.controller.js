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
  if (req.files?.cover_image?.[0]) data.cover_image_url = req.files.cover_image[0].path;
  if (req.files?.book_file?.[0]) data.pdf_url = req.files.book_file[0].path;
  if (req.files?.preview_pages?.length) {
    data.preview_pages = JSON.stringify(
      req.files.preview_pages.map((f) => f.path)
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
  const books = await service.listBooks(req.query.status);
  sendSuccess(res, books);
});

exports.getBook = catchAsync(async (req, res) => {
  const book = await service.getBookById(req.params.id);
  if (!book || book.status !== "approved") {
    throw new AppError("Book not found", 404);
  }
  sendSuccess(res, book);
});
