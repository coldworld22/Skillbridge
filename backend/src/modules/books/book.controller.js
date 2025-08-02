const service = require("./book.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");

exports.createBook = catchAsync(async (req, res) => {
  const data = {
    title: req.body.title,
    description: req.body.description,
    price: req.body.price,
    pdf_url: req.body.pdf_url,
    cover_image_url: req.body.cover_image_url,
    category_id: req.body.category_id,
    instructor_id: req.user.id,
    status: req.body.status || "pending",
  };
  const book = await service.createBook(data);
  sendSuccess(res, book, "Book created");
});

exports.listBooks = catchAsync(async (_req, res) => {
  const books = await service.listBooks();
  sendSuccess(res, books);
});

exports.getBook = catchAsync(async (req, res) => {
  const book = await service.getBookById(req.params.id);
  if (!book || book.status !== "approved") {
    throw new AppError("Book not found", 404);
  }
  sendSuccess(res, book);
});
