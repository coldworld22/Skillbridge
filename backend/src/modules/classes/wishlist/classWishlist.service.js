const db = require('../../../config/database');
const { v4: uuidv4 } = require('uuid');

exports.add = async (userId, classId) => {
  const [item] = await db('class_wishlist')
    .insert({ id: uuidv4(), user_id: userId, class_id: classId })
    .onConflict(['user_id','class_id']).ignore()
    .returning('*');
  return item;
};

exports.remove = async (userId, classId) => {
  return db('class_wishlist').where({ user_id: userId, class_id: classId }).del();
};

exports.listByUser = async (userId) => {
  return db('class_wishlist as w')
    .join('online_classes as c','w.class_id','c.id')
    .select('c.*','w.created_at')
    .where('w.user_id', userId);
};
