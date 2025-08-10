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
