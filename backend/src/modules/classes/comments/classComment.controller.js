const db = require('../../../config/database');
const catchAsync = require('../../../utils/catchAsync');
const { sendSuccess } = require('../../../utils/response');
const { v4: uuidv4 } = require('uuid');

exports.createComment = catchAsync(async (req, res) => {
  const { classId } = req.params;
  const { message, parent_id } = req.body;
  const user_id = req.user.id;

  const id = uuidv4();
  await db('class_comments').insert({
    id,
    class_id: classId,
    user_id,
    message,
    parent_id: parent_id || null,
  });

  sendSuccess(res, { id }, 'Comment posted');
});

exports.getComments = catchAsync(async (req, res) => {
  const { classId } = req.params;

  const comments = await db('class_comments')
    .join('users', 'users.id', 'class_comments.user_id')
    .where('class_comments.class_id', classId)
    .select(
      'class_comments.*',
      'users.full_name',
      'users.avatar_url'
    )
    .orderBy('created_at', 'asc');

  sendSuccess(res, comments, 'Comments fetched');
});
