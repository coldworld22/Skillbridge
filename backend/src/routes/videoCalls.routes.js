const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth/authMiddleware');
const verifyVideoCallAccess = require('../middleware/auth/verifyVideoCallAccess');
const verifyHostRole = require('../middleware/auth/verifyHostRole');
const db = require('../config/database');
const { state } = require('../sockets');
const logger = require('../utils/logger.js');
const { analyzeText } = require('../modules/moderation/moderationEngine');
const chatService = require('../modules/chat/chat.service');

router.get('/:roomId/participants', verifyToken, verifyVideoCallAccess, async (req, res) => {
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

router.patch('/:roomId/participants/:id', verifyToken, verifyVideoCallAccess, verifyHostRole, async (req, res) => {
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

router.delete('/:roomId/participants/:id', verifyToken, verifyVideoCallAccess, verifyHostRole, async (req, res) => {
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

router.get('/:roomId/messages', verifyToken, verifyVideoCallAccess, async (req, res) => {
  try {
    const messages = await db('video_call_messages')
      .select(
        'id',
        'room_id',
        'sender_id',
        'sender',
        'text',
        'timestamp',
        'is_flagged',
        'flag_severity',
        'moderation_status',
        'flag_metadata',
        'flagged_at'
      )
      .where({ room_id: req.params.roomId })
      .orderBy('timestamp', 'asc');
    const enriched = messages.map((message) => ({
      ...message,
      redacted: message.moderation_status === 'blocked',
    }));
    res.json(enriched);
  } catch (err) {
    logger.error('Failed to fetch video call messages', err);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

router.post('/:roomId/messages', verifyToken, verifyVideoCallAccess, async (req, res) => {
  const { text } = req.body || {};
  const roomId = req.params.roomId;
  const trimmed = text?.trim();
  if (!trimmed) {
    return res.status(400).json({ message: 'Message text required' });
  }

  const senderName =
    req.user.full_name || req.user.name || req.user.email || 'Participant';
  const analysis = analyzeText(trimmed);
  const flagged = Boolean(analysis.flagged);
  const now = new Date();

  let priorContextFlags = 0;
  if (flagged) {
    try {
      const result = await db('chat_moderation')
        .where({ user_id: req.user.id })
        .andWhere('context_type', 'video_call')
        .andWhere('context_id', roomId)
        .count('id as count')
        .first();
      priorContextFlags = Number(result?.count ?? 0);
    } catch (countErr) {
      logger.error('Failed to resolve prior moderation count', countErr);
    }
  }

  const moderationStatus = flagged
    ? analysis.autopilot.shouldBlock
      ? 'blocked'
      : priorContextFlags >= 2
      ? 'escalated'
      : 'pending_review'
    : 'visible';

  const metadata = flagged
    ? {
        matches: analysis.matches,
        heuristics: analysis.heuristics,
        reason: analysis.reason,
        score: analysis.score,
        autopilot: analysis.autopilot,
        repeat_offenses: priorContextFlags + 1,
        repeat_window_hours: 24,
        repeat_offender: priorContextFlags > 0,
      }
    : {};

  try {
    const [message] = await db('video_call_messages')
      .insert({
        room_id: roomId,
        sender_id: req.user.id,
        sender: senderName,
        text: trimmed,
        is_flagged: flagged,
        flag_severity: flagged ? analysis.severity : null,
        moderation_status: moderationStatus,
        flag_metadata: metadata,
        flagged_at: flagged ? now : null,
      })
      .returning('*');

    const payload = {
      ...message,
      redacted: flagged && analysis.autopilot.shouldBlock,
    };

    if (flagged) {
      chatService
        .logModerationEvent({
          userId: req.user.id,
          message: trimmed,
          matchedWords: analysis.matches,
          contextType: 'video_call',
          contextId: roomId,
          messageId: message.id,
          severity: analysis.severity || 'medium',
          status: moderationStatus,
          autoActionTaken: analysis.autopilot.shouldBlock,
          metadata: {
            ...metadata,
            source: 'video_call_message',
          },
        })
        .catch((err) => {
          logger.error('Failed to log moderation event for video call', err);
        });
    }

    if (state.io) {
      try {
        state.io.to(roomId).emit('call-message', payload);
        if (flagged) {
          state.io.to(roomId).emit('call-message-flagged', {
            messageId: message.id,
            roomId,
            severity: analysis.severity,
            matches: analysis.matches,
            heuristics: analysis.heuristics,
            reason: analysis.reason,
            sender_id: req.user.id,
            timestamp: message.timestamp,
            autoActionTaken: analysis.autopilot.shouldBlock,
            moderation_status: moderationStatus,
            repeatOffenses: priorContextFlags + 1,
            flag_metadata: metadata,
          });
        }
      } catch (emitErr) {
        logger.error('Failed to emit video call message events', emitErr);
      }
    } else if (flagged) {
      logger.warn(
        `Moderation flagged message ${message.id} in room ${roomId} but socket server is not initialised`
      );
    }

    res.status(201).json(payload);
  } catch (err) {
    logger.error('Failed to store video call message', err);
    res.status(500).json({ message: 'Failed to store message' });
  }
});

module.exports = router;
