const { Server } = require('socket.io');
const db = require('../config/database');
const logger = require('../utils/logger.js');

const state = {
  io: null,
  rooms: {},
  participants: {},
  userSockets: {},
};

function initSockets(server, allowedOrigins) {
  state.io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
  });
  state.rooms = {};
  state.participants = {};
  state.userSockets = {};

  const { io, rooms, participants, userSockets } = state;

  io.on('connection', (socket) => {
    socket.on('register', ({ userId }) => {
      if (!userId) return;
      userSockets[userId] = socket.id;
      socket.userId = userId;
    });

    socket.on('call-user', async ({ to, roomId }) => {
      const from = socket.userId;
      const target = userSockets[to];
      if (from && target) {
        try {
          const caller = await db('users')
            .select('full_name')
            .where({ id: from })
            .first();
          io.to(target).emit('incoming-call', {
            chatId: from,
            roomId,
            name: caller?.full_name || '',
          });
        } catch (err) {
          logger.error('Failed to handle call-user event', err);
        }
      }
    });

    socket.on('call-accepted', ({ chatId, roomId }) => {
      const target = userSockets[chatId];
      if (socket.userId && target) {
        io.to(target).emit('call-accepted', { chatId: socket.userId, roomId });
      }
    });

    socket.on('call-declined', ({ chatId }) => {
      const target = userSockets[chatId];
      if (socket.userId && target) {
        io.to(target).emit('call-declined', { chatId: socket.userId });
      }
    });

    socket.on('call-cancelled', ({ chatId }) => {
      const target = userSockets[chatId];
      if (socket.userId && target) {
        io.to(target).emit('call-cancelled', { chatId: socket.userId });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId && userSockets[socket.userId] === socket.id) {
        delete userSockets[socket.userId];
      }
    });

    socket.on('join-room', ({ roomId, name, role }) => {
      rooms[roomId] = rooms[roomId] || [];
      participants[roomId] = participants[roomId] || [];
      rooms[roomId].push(socket.id);
      const participant = { id: socket.id, name, role: role || 'participant', isMuted: false };
      participants[roomId].push(participant);
      socket.join(roomId);
      socket.emit('all-users', rooms[roomId].filter((id) => id !== socket.id));

      db('video_call_participants')
        .insert({ room_id: roomId, socket_id: socket.id, name, role: role || 'participant' })
        .returning('id')
        .then(([row]) => {
          socket.participantDbId = row.id;
        })
        .catch((err) => logger.error('Failed to store participant', err));

      socket.on('sending-signal', (payload) => {
        io.to(payload.userToSignal).emit('user-joined', {
          signal: payload.signal,
          callerID: payload.callerID,
        });
      });

      socket.on('returning-signal', (payload) => {
        io.to(payload.callerID).emit('receiving-returned-signal', {
          signal: payload.signal,
          id: socket.id,
        });
      });

      socket.on('disconnect', () => {
        rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
        participants[roomId] = participants[roomId].filter((p) => p.id !== socket.id);
        socket.to(roomId).emit('user-disconnected', socket.id);
        if (!rooms[roomId].length) {
          delete rooms[roomId];
          delete participants[roomId];
        }
        if (socket.participantDbId) {
          db('video_call_participants')
            .where({ id: socket.participantDbId })
            .update({ left_at: new Date() })
            .catch((err) => logger.error('Failed to update participant leave', err));
        }
      });
    });
  });

  return state;
}

module.exports = { initSockets, state };
