const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth/authMiddleware');
const verifyEnrollment = require('../middleware/auth/verifyEnrollment');
const verifyHostRole = require('../middleware/auth/verifyHostRole');
const db = require('../config/database');
const { state } = require('../sockets');

router.get('/:roomId/participants', verifyToken, verifyEnrollment, async (req, res) => {
  try {
    const rows = await db('video_call_participants')
      .select('socket_id as id', 'name', 'role', 'is_muted as isMuted', 'joined_at')
      .where({ room_id: req.params.roomId })
      .andWhere('left_at', null);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch participants' });
  }
});

router.patch('/:roomId/participants/:id', verifyToken, verifyHostRole, async (req, res) => {
  const { roomId, id } = req.params;
  const { isMuted, role } = req.body || {};
  const updateData = {};
  if (typeof isMuted === 'boolean') updateData.is_muted = isMuted;
  if (role) updateData.role = role;
  if (Object.keys(updateData).length === 0)
    return res.status(400).json({ message: 'No fields to update' });
  try {
    await db('video_call_participants')
      .where({ room_id: roomId, socket_id: id })
      .andWhere('left_at', null)
      .update(updateData);
    if (state.participants[roomId]) {
      const p = state.participants[roomId].find((p) => p.id === id);
      if (p) {
        if (typeof isMuted === 'boolean') p.isMuted = isMuted;
        if (role) p.role = role;
      }
    }
    const [participant] = await db('video_call_participants')
      .select('socket_id as id', 'name', 'role', 'is_muted as isMuted')
      .where({ room_id: roomId, socket_id: id })
      .andWhere('left_at', null);
    state.io.to(roomId).emit('participant-updated', participant);
    res.json(participant);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update participant' });
  }
});

router.delete('/:roomId/participants/:id', verifyToken, verifyHostRole, async (req, res) => {
  const { roomId, id } = req.params;
  try {
    await db('video_call_participants')
      .where({ room_id: roomId, socket_id: id })
      .andWhere('left_at', null)
      .update({ left_at: new Date() });
    if (state.participants[roomId]) {
      state.participants[roomId] = state.participants[roomId].filter((p) => p.id !== id);
    }
    state.io.to(roomId).emit('participant-removed', { id });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove participant' });
  }
});

router.get('/:roomId/messages', verifyToken, async (req, res) => {
  try {
    const messages = await db('video_call_messages')
      .where({ room_id: req.params.roomId })
      .orderBy('timestamp', 'asc');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

router.post('/:roomId/messages', verifyToken, verifyEnrollment, async (req, res) => {
  const { text } = req.body || {};
  const roomId = req.params.roomId;
  if (!text?.trim())
    return res.status(400).json({ message: 'Message text required' });
  try {
    const [message] = await db('video_call_messages')
      .insert({
        room_id: roomId,
        sender_id: req.user.id,
        sender: req.user.full_name,
        text: text.trim(),
      })
      .returning('*');
    state.io.to(roomId).emit('call-message', message);
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Failed to store message' });
  }
});

module.exports = router;
