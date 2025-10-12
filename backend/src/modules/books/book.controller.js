const service = require("./book.service");
const { processTags, resolveIncludedPlanIds } = require("./book.utils");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const mailService = require("../../services/mailService");
const userModel = require("../users/user.model");
const fs = require("fs");
const {
  resolveUploadFilePath,
  buildDownloadFilename,
} = require("../../utils/uploads");

const normalizeRole = (role = "") => role.toLowerCase().replace(/\s+/g, "");
const isAdminRole = (roles = []) => {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr
    .map((r) => normalizeRole(r))
    .some((r) => ["admin", "superadmin"].includes(r));
};

const removeUploadedFiles = async (files = {}) => {
  const allFiles = Object.values(files).flat();
  await Promise.all(
    allFiles.map((file) =>
      file?.path ? fs.promises.unlink(file.path).catch(() => {}) : null
    )
  );
};

exports.createBook = catchAsync(async (req, res) => {
  try {
    const { tags: rawTags, included_plans, ...data } = req.body;
    data.instructor_id = req.user.id;
    data.status = "pending";
    if (req.files?.cover_image?.[0])
      data.cover_image_url =
        "/uploads/books/" + req.files.cover_image[0].filename;
    if (req.files?.book_file?.[0])
      data.pdf_url = "/uploads/books/" + req.files.book_file[0].filename;
    if (req.files?.preview_pages?.length) {
      data.preview_pages = req.files.preview_pages.map(
        (f) => "/uploads/books/previews/" + f.filename
      );
    }

    data.included_plans = await resolveIncludedPlanIds(included_plans);

    const book = await service.createBook(data);

    book.tags = await processTags(rawTags, book.id);

    const userMessage =
      "Your book was submitted successfully and is under review.";
    const admins = await userModel.findAdmins();
    const adminMessage =
      `Instructor ${req.user.full_name || "Instructor"} submitted a new book "${
        book.title
      }" that is awaiting your review.`;

    const senderAdmin = admins[0];

    await Promise.all([
      notificationService.createNotification({
        user_id: req.user.id,
        type: "book_submitted",
        message: userMessage,
      }),
      messageService.createMessage({
        sender_id: senderAdmin ? senderAdmin.id : req.user.id,
        receiver_id: req.user.id,
        message: userMessage,
      }),
      req.user.email
        ? mailService.sendMail({
            to: req.user.email,
            subject: "Book submitted for review",
            html: `<p>${userMessage} We will notify you when it is published.</p>`,
          })
        : Promise.resolve(),
      ...admins.map((admin) =>
        Promise.all([
          notificationService.createNotification({
            user_id: admin.id,
            type: "new_book",
            message: adminMessage,
          }),
          messageService.createMessage({
            sender_id: req.user.id,
            receiver_id: admin.id,
            message: adminMessage,
          }),
          admin.email
            ? mailService.sendMail({
                to: admin.email,
                subject: "New book submitted",
                html: `<p>${adminMessage}</p>`,
              })
            : Promise.resolve(),
        ])
      ),
    ]);

    return sendSuccess(res, book, "Book submitted for review");
  } catch (error) {
    await removeUploadedFiles(req.files);
    throw error;
  }
});

exports.listBooks = catchAsync(async (req, res) => {
  const result = await service.listBooks({
    ...req.query,
    status: req.query.status || "active",
  });
  sendSuccess(res, result.data, "Books fetched", result.meta);
});

exports.listBooksAdmin = catchAsync(async (req, res) => {
  const result = await service.listBooks(req.query);
  sendSuccess(res, result.data, "Books fetched", result.meta);
});

exports.listInstructorBooks = catchAsync(async (req, res) => {
  const result = await service.listBooks({
    ...req.query,
    instructorId: req.user.id,
  });
  sendSuccess(res, result.data, "Books fetched", result.meta);
});

exports.getInstructorBookAnalytics = catchAsync(async (req, res) => {
  const data = await service.getInstructorBookAnalytics(req.user.id);
  sendSuccess(res, data);
});

exports.getBook = catchAsync(async (req, res) => {
  const book = await service.getBookById(req.params.id);
  if (!book || !["approved", "active"].includes(book.status)) {
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
  try {
    const existing = await service.getBookById(req.params.id);
    if (!existing) throw new AppError("Book not found", 404);
    if (
      !isAdminRole(req.user.roles || req.user.role) &&
      existing.instructor_id !== req.user.id
    ) {
      throw new AppError("Access denied", 403);
    }

    const {
      tags: rawTags,
      included_plans,
      remove_preview_pages,
      ...data
    } = req.body;

    if (req.files?.cover_image?.[0]) {
      data.cover_image_url =
        "/uploads/books/" + req.files.cover_image[0].filename;
    }
    if (req.files?.book_file?.[0]) {
      data.pdf_url = "/uploads/books/" + req.files.book_file[0].filename;
    }
    if (req.files?.preview_pages?.length) {
      data.preview_pages = req.files.preview_pages.map(
        (f) => "/uploads/books/previews/" + f.filename
      );
    }

    const removePreviews =
      remove_preview_pages === "1" ||
      remove_preview_pages === "true" ||
      remove_preview_pages === 1 ||
      remove_preview_pages === true;

    if (included_plans !== undefined) {
      data.included_plans = await resolveIncludedPlanIds(included_plans);
    }

    const book = await service.updateBook(req.params.id, data, {
      removePreviewPages: removePreviews,
    });

    book.tags = await service.updateBookTags(book.id, rawTags);

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
  } catch (error) {
    await removeUploadedFiles(req.files);
    throw error;
  }
});

exports.deleteBook = catchAsync(async (req, res) => {
  const existing = await service.getBookById(req.params.id);
  if (!existing) throw new AppError("Book not found", 404);
  if (
    !isAdminRole(req.user.roles || req.user.role) &&
    existing.instructor_id !== req.user.id
  ) {
    throw new AppError("Access denied", 403);
  }
  await service.clearBookTags(req.params.id);
  await service.deleteBook(req.params.id);
  sendSuccess(res, null, "Book deleted");
});

exports.updateBookStatus = catchAsync(async (req, res) => {
  const { status } = req.body || {};
  const existing = await service.getBookById(req.params.id);
  if (!existing) throw new AppError("Book not found", 404);
  if (
    !isAdminRole(req.user.roles || req.user.role) &&
    existing.instructor_id !== req.user.id
  ) {
    throw new AppError("Access denied", 403);
  }
  const book = await service.updateBookStatus(req.params.id, status);
  if (!book) {
    throw new AppError("Book not found", 404);
  }

  const [admins, instructor] = await Promise.all([
    userModel.findAdmins(),
    userModel.findById(book.instructor_id),
  ]);

  const instructorMessage = `Your book "${book.title}" status was updated to ${status}.`;
  const adminMessage = `Book "${book.title}" status changed to ${status}.`;

  await Promise.all([
    instructor
      ? Promise.all([
          notificationService.createNotification({
            user_id: instructor.id,
            type: "book_status",
            message: instructorMessage,
          }),
          messageService.createMessage({
            sender_id: req.user.id,
            receiver_id: instructor.id,
            message: instructorMessage,
          }),
          instructor.email
            ? mailService.sendMail({
                to: instructor.email,
                subject: `Book status updated`,
                html: `<p>${instructorMessage}</p>`,
              })
            : Promise.resolve(),
        ])
      : Promise.resolve(),
    ...admins.map((admin) =>
      Promise.all([
        notificationService.createNotification({
          user_id: admin.id,
          type: "book_status",
          message: adminMessage,
        }),
        messageService.createMessage({
          sender_id: req.user.id,
          receiver_id: admin.id,
          message: adminMessage,
        }),
        admin.email
            ? mailService.sendMail({
                to: admin.email,
                subject: "Book status updated",
                html: `<p>${adminMessage}</p>`,
              })
          : Promise.resolve(),
      ])
    ),
  ]);

sendSuccess(res, book, "Book status updated");
});

exports.downloadBookFile = catchAsync(async (req, res) => {
  const book = await service.getBookById(req.params.id);
  if (!book) {
    throw new AppError("Book not found", 404);
  }

  const isAdmin = isAdminRole(req.user.roles || req.user.role);
  const isOwner = book.instructor_id && book.instructor_id === req.user.id;
  if (!isAdmin && !isOwner) {
    throw new AppError("Access denied", 403);
  }
  if (!book.pdf_url) {
    throw new AppError("File not found", 404);
  }

  const filePath = resolveUploadFilePath(book.pdf_url);
  if (!filePath) {
    throw new AppError("File not found", 404);
  }

  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch {
    throw new AppError("File not found", 404);
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${buildDownloadFilename(book.title)}"`
  );

  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    res.status(500).end();
  });
  stream.pipe(res);
});

exports.updateCart = catchAsync(async (req, res) => {
  const { bookId, action } = req.body;
  const book = await service.getBookById(bookId);
  if (!book) throw new AppError("Book not found", 404);
  if (book.status !== "active") throw new AppError("Book is not active", 400);
  if (action === "remove") {
    await service.removeFromCart(req.user.id, bookId);
    return sendSuccess(res, null, "Removed from cart");
  }
  const item = await service.addToCart(req.user.id, bookId);
  sendSuccess(res, item, "Added to cart");
});

exports.checkout = catchAsync(async (req, res) => {
  const purchases = await service.checkout(req.user.id);
  sendSuccess(res, purchases, 'Checkout complete');
});

exports.addWishlist = catchAsync(async (req, res) => {
  const book = await service.getBookById(req.body.bookId);
  if (!book) throw new AppError('Book not found', 404);
  if (book.status !== 'active') throw new AppError('Book is not active', 400);
  await service.addToWishlist(req.user.id, req.body.bookId);
  sendSuccess(res, null, 'Added to wishlist');
});

exports.removeWishlist = catchAsync(async (req, res) => {
  const book = await service.getBookById(req.body.bookId);
  if (!book) throw new AppError('Book not found', 404);
  if (book.status !== 'active') throw new AppError('Book is not active', 400);
  await service.removeFromWishlist(req.user.id, req.body.bookId);
  sendSuccess(res, null, 'Removed from wishlist');
});
