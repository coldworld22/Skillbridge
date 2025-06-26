const db = require('../../../config/database');
const catchAsync = require('../../../utils/catchAsync');
const { sendSuccess } = require('../../../utils/response');

exports.submitReview = catchAsync(async (req, res) => {
  const { classId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const exists = await db('class_reviews')
    .where({ class_id: classId, user_id: userId })
    .first();

  if (exists) {
    await db('class_reviews')
      .where({ class_id: classId, user_id: userId })
      .update({ rating, comment, created_at: db.fn.now() });
  } else {
    await db('class_reviews').insert({
      class_id: classId,
      user_id: userId,
      rating,
      comment,
    });
  }

  sendSuccess(res, null, 'Review submitted');
});

exports.getReviews = catchAsync(async (req, res) => {
  const { classId } = req.params;

  const reviews = await db('class_reviews')
    .join('users', 'users.id', 'class_reviews.user_id')
    .where('class_reviews.class_id', classId)
    .select(
      'class_reviews.id',
      'class_reviews.rating',
      'class_reviews.comment',
      'class_reviews.created_at',
      'users.full_name',
      'users.avatar_url'
    );

  sendSuccess(res, reviews, 'Reviews fetched');
});
