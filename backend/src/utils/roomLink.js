const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

exports.createLessonRoomLink = (lessonId) => {
  const roomId = uuidv4();
  const token = jwt.sign({ lessonId, roomId }, process.env.JWT_SECRET, { expiresIn: '2h' });
  const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const url = `${base}/video-call/${roomId}?token=${token}`;
  return { roomId, url, token };
};
