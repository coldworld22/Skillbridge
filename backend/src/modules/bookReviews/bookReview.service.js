const model = require("./bookReview.model");

exports.createReview = (data) => model.create(data);

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
