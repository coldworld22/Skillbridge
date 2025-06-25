const db = require('../../../config/database');
const { v4: uuidv4 } = require('uuid');

exports.add = async (userId, tutorialId) => {
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
