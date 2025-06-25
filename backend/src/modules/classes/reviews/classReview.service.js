const db = require('../../../config/database');

exports.upsertReview = async ({ class_id, user_id, rating, comment }) => {
  const exists = await db('class_reviews')
    .where({ class_id, user_id })
    .first();

  if (exists) {
    return db('class_reviews')
      .where({ class_id, user_id })
      .update({ rating, comment, created_at: db.fn.now() });
  }

  return db('class_reviews').insert({ class_id, user_id, rating, comment });
};

exports.getByClass = async (class_id) => {
  return db('class_reviews')
    .join('users', 'users.id', 'class_reviews.user_id')
    .where('class_reviews.class_id', class_id)
    .select(
      'class_reviews.id',
      'class_reviews.rating',
      'class_reviews.comment',
      'class_reviews.created_at',
      'users.full_name',
      'users.avatar_url'
    );
};
