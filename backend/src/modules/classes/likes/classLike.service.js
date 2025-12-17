const db = require('../../../config/database');
const { v4: uuidv4 } = require('uuid');

exports.add = async (userId, classId) => {
  const [item] = await db('class_likes')
    .insert({ id: uuidv4(), user_id: userId, class_id: classId })
    .onConflict(['user_id','class_id']).ignore()
    .returning('*');
  return item;
};

exports.remove = async (userId, classId) => {
  return db('class_likes').where({ user_id: userId, class_id: classId }).del();
};

exports.listByUser = async (userId) => {
  return db('class_likes as l')
    .join('online_classes as c','l.class_id','c.id')
    .select('c.*','l.created_at')
    .where('l.user_id', userId);
};
