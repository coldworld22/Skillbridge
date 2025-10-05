const db = require('../../../config/database');
const { v4: uuidv4 } = require('uuid');

const ACTIVE_ENROLLMENT_STATUSES = ['enrolled'];

exports.subscribe = async (userId, classId) => {
  const [item] = await db('class_reminder_subscriptions')
    .insert({ id: uuidv4(), user_id: userId, class_id: classId })
    .onConflict(['user_id', 'class_id'])
    .ignore()
    .returning('*');
  return item;
};

exports.getSubscribedStudentsByClass = async (
  classId,
  statuses = ACTIVE_ENROLLMENT_STATUSES,
) => {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    statuses = ACTIVE_ENROLLMENT_STATUSES;
  }

  return db('class_reminder_subscriptions as crs')
    .join('class_enrollments as ce', function joinEnrollments() {
      this.on('crs.user_id', '=', 'ce.user_id').andOn(
        'crs.class_id',
        '=',
        'ce.class_id',
      );
    })
    .join('users as u', 'ce.user_id', 'u.id')
    .where('crs.class_id', classId)
    .whereIn('ce.status', statuses)
    .select(
      'u.id',
      'u.full_name',
      'u.email',
      'u.phone',
      'u.locale',
      'ce.status',
      'ce.enrolled_at',
    )
    .orderBy('ce.enrolled_at');
};

exports.ACTIVE_ENROLLMENT_STATUSES = ACTIVE_ENROLLMENT_STATUSES;
