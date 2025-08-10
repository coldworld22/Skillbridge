const db = require('../../../../config/database');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../../../../utils/AppError');

exports.add = async (userId, tutorialId) => {
  const tutorial = await db('tutorials').where({ id: tutorialId }).first();
  if (!tutorial) throw new AppError('Tutorial not found', 404);
  if (tutorial.moderation_status !== 'Approved')
    throw new AppError('Tutorial not approved', 400);
  if (tutorial.status !== 'published')
    throw new AppError('Tutorial not published', 400);

  const [item] = await db('tutorial_wishlist')
    .insert({ id: uuidv4(), user_id: userId, tutorial_id: tutorialId })
    .onConflict(['user_id','tutorial_id']).ignore()
    .returning('*');
  return item;
};

exports.remove = async (userId, tutorialId) => {
  return db('tutorial_wishlist').where({ user_id: userId, tutorial_id: tutorialId }).del();
};

exports.listByUser = async (userId) => {
  return db('tutorial_wishlist as w')
    .join('tutorials as t','w.tutorial_id','t.id')
    .select('t.*','w.created_at')
    .where('w.user_id', userId);
};
