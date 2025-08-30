const model = require("./bookReview.model");
const db = require("../../config/database");
const AppError = require("../../utils/AppError");

exports.ensurePurchased = async (studentId, bookId) => {
  const row = await db("book_purchases")
    .where({ student_id: studentId, book_id: bookId })
    .first();
  if (!row) throw new AppError("Book not purchased", 403);
  return row;
};

exports.createReview = (data) => model.create(data);

exports.findById = (id) => model.findById(id);

exports.listReviews = async (bookId) => {
  const reviews = await model.listByBook(bookId);
  const averageRating = await model.averageRating(bookId);
  return { reviews, averageRating };
};

exports.updateReview = async (id, data) => {
  const [row] = await model.update(id, data);
  return row;
};

exports.deleteReview = (id) => model.remove(id);
