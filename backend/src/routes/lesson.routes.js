const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth/authMiddleware');
const db = require('../config/database');
const { createLessonRoomLink } = require('../utils/roomLink');

router.post('/:lessonId/room', verifyToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await db('class_lessons as l')
      .join('online_classes as c', 'l.class_id', 'c.id')
      .select('l.class_id', 'c.instructor_id')
      .where('l.id', lessonId)
      .first();
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    const isInstructor = lesson.instructor_id === req.user.id;
    let isStudent = false;
    if (!isInstructor) {
      const enrollment = await db('class_enrollments')
        .where({ class_id: lesson.class_id, user_id: req.user.id })
        .first();
      if (enrollment) {
        if (enrollment.status === 'suspended') {
          return res
            .status(403)
            .json({ message: 'Access suspended pending installment payment' });
        }
        if (enrollment.status !== 'cancelled') {
          isStudent = true;
        }
      }
    }
    if (!isInstructor && !isStudent)
      return res.status(403).json({ message: 'Not allowed' });
    const link = createLessonRoomLink(lessonId);
    res.json(link);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate room link' });
  }
});

module.exports = router;
