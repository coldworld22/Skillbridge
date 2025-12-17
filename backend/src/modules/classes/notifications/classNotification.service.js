const db = require('../../../config/database');
const { v4: uuidv4 } = require('uuid');

exports.subscribe = async (userId, classId) => {
  const [item] = await db('class_reminder_subscriptions')
    .insert({ id: uuidv4(), user_id: userId, class_id: classId })
    .onConflict(['user_id', 'class_id'])
    .ignore()
    .returning('*');
  return item;
};

exports.getSubscribersWithContact = async (classId) => {
  return db('class_reminder_subscriptions as crs')
    .join('users as u', 'crs.user_id', 'u.id')
    .where('crs.class_id', classId)
    .select('u.id', 'u.email', 'u.phone', 'u.locale');
};
