const db = require('../../../../config/database');
const { v4: uuidv4 } = require('uuid');

exports.add = async (userId, tutorialId) => {
  const [item] = await db('tutorial_favorites')
    .insert({ id: uuidv4(), user_id: userId, tutorial_id: tutorialId })
    .onConflict(['user_id','tutorial_id']).ignore()
    .returning('*');
  return item;
};

exports.remove = async (userId, tutorialId) => {
  return db('tutorial_favorites').where({ user_id: userId, tutorial_id: tutorialId }).del();
};

exports.listByUser = async (userId) => {
  return db('tutorial_favorites as f')
    .join('tutorials as t','f.tutorial_id','t.id')
    .select('t.*','f.created_at')
    .where('f.user_id', userId);
};
