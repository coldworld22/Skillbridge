const db = require('../../../config/database');

exports.createComment = async (data) => {
  await db('class_comments').insert(data);
  return data;
};

exports.getByClass = async (class_id) => {
  return db('class_comments')
    .join('users', 'users.id', 'class_comments.user_id')
    .where('class_comments.class_id', class_id)
    .select(
      'class_comments.*',
      'users.full_name',
      'users.avatar_url'
    )
    .orderBy('created_at', 'asc');
};
