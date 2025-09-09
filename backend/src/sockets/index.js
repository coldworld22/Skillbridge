const { Server } = require('socket.io');
const db = require('../config/database');
const logger = require('../utils/logger.js');
const store = require('../utils/socketStore');

const state = {
  io: null,
};

function initSockets(server, allowedOrigins) {
  state.io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  const { io } = state;

  io.on('connection', (socket) => {
    socket.on('register', async ({ userId }) => {
      if (!userId) return;
      await store.addUserSocket(userId, socket.id);
      socket.userId = userId;
    });

    socket.on('call-user', async ({ to, roomId }) => {
      const from = socket.userId;
      const target = await store.getUserSocket(to);
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

    socket.on('call-accepted', async ({ chatId, roomId }) => {
      const target = await store.getUserSocket(chatId);
      if (socket.userId && target) {
        io.to(target).emit('call-accepted', { chatId: socket.userId, roomId });
      }
    });

    socket.on('call-declined', async ({ chatId }) => {
      const target = await store.getUserSocket(chatId);
      if (socket.userId && target) {
        io.to(target).emit('call-declined', { chatId: socket.userId });
      }
    });

    socket.on('call-cancelled', async ({ chatId }) => {
      const target = await store.getUserSocket(chatId);
      if (socket.userId && target) {
        io.to(target).emit('call-cancelled', { chatId: socket.userId });
      }
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        await store.removeUserSocket(socket.userId, socket.id);
      }
    });

    socket.on('join-room', async ({ roomId, name, role }) => {
      const participant = { id: socket.id, name, role: role || 'participant', isMuted: false };
      await store.addSocketToRoom(roomId, socket.id, participant);
      socket.join(roomId);
      const others = (await store.getRoomSockets(roomId)).filter((id) => id !== socket.id);
      socket.emit('all-users', others);

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

      socket.on('disconnect', async () => {
        await store.removeSocketFromRoom(roomId, socket.id);
        socket.to(roomId).emit('user-disconnected', socket.id);
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
