const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger.js');
const { isAdminRole } = require('../utils/role');
const ensureVideoCallSchema = require('../utils/ensureVideoCallSchema');

const state = {
  io: null,
  rooms: {},
  participants: {},
  userSockets: {},
  sessions: {},
  waiting: {},
  handRaises: {},
  breakouts: {},
};

const getRoomArray = (store, roomId) => {
  if (!store[roomId]) {
    store[roomId] = [];
  }
  return store[roomId];
};

const clearRoomState = (roomId) => {
  delete state.rooms[roomId];
  delete state.participants[roomId];
  delete state.sessions[roomId];
  delete state.waiting[roomId];
  delete state.handRaises[roomId];
  delete state.breakouts[roomId];
};

const findParticipant = (roomId, predicate) => {
  const participants = state.participants[roomId] || [];
  return participants.find(predicate);
};

const isHostLike = (roomId, socketId) => {
  const participant = findParticipant(
    roomId,
    (p) => p.id === socketId || p.socketId === socketId,
  );
  if (!participant) return false;
  return participant.role === 'host' || participant.role === 'co-host';
};

const emitWaitingRoom = (roomId) => {
  state.io.to(roomId).emit('waiting-room', {
    roomId,
    requests: state.waiting[roomId] || [],
  });
};

const enqueueWaiting = ({ roomId, socket, displayName, role }) => {
  const request = {
    id: uuidv4(),
    userId: socket.userId,
    socketId: socket.id,
    name: displayName,
    role,
    requestedAt: new Date().toISOString(),
  };
  const queue = getRoomArray(state.waiting, roomId);
  queue.push(request);
  socket.pendingRoomId = roomId;
  socket.pendingRequestId = request.id;
  socket.emit('join-pending', { roomId, requestId: request.id });
  emitWaitingRoom(roomId);
};

const removeWaitingEntry = ({ roomId, requestId, socketId }) => {
  const queue = state.waiting[roomId];
  if (!Array.isArray(queue)) return null;
  let index = -1;
  const match = queue.find((entry, idx) => {
    const matchesId =
      (requestId && entry.id === requestId) || (!requestId && entry.socketId === socketId);
    if (matchesId) {
      index = idx;
      return true;
    }
    return false;
  });
  if (index >= 0) {
    queue.splice(index, 1);
    emitWaitingRoom(roomId);
  }
  return match || null;
};

const removeWaitingBySocket = (socketId) => {
  Object.keys(state.waiting).forEach((roomId) => {
    removeWaitingEntry({ roomId, socketId });
  });
};

const getBreakoutState = (roomId) => {
  if (!state.breakouts[roomId]) {
    state.breakouts[roomId] = {
      rooms: [],
      assignments: {},
      activeMemberships: {},
    };
  }
  return state.breakouts[roomId];
};

const emitBreakoutUpdate = (roomId) => {
  const data = getBreakoutState(roomId);
  state.io.to(roomId).emit('breakout-update', { roomId, ...data });
};

async function admitParticipant({ roomId, socket, role, displayName }) {
  const rooms = getRoomArray(state.rooms, roomId);
  const participants = getRoomArray(state.participants, roomId);
  const participant = {
    id: socket.id,
    socketId: socket.id,
    userId: socket.userId,
    name: displayName,
    role: role || 'participant',
    isMuted: false,
  };

  rooms.push(socket.id);
  participants.push(participant);
  socket.join(roomId);
  socket.currentRoomId = roomId;
  socket.emit(
    'all-users',
    rooms.filter((id) => id !== socket.id),
  );
  socket.emit('join-accepted', {
    roomId,
    role: participant.role,
    session: state.sessions[roomId] || { live: false },
  });
  socket.emit('participant-list', participants);
  socket.to(roomId).emit('participant-joined', participant);

  if (participant.role === 'host') {
    state.sessions[roomId] = {
      live: true,
      startedAt: state.sessions[roomId]?.startedAt || new Date().toISOString(),
      startedBy: socket.userId,
    };
    emitSessionStatus(state.io, roomId);
  } else if (state.sessions[roomId]) {
    emitSessionStatus(state.io, roomId);
  }

  try {
    const [row] = await db('video_call_participants')
      .insert({
        room_id: roomId,
        socket_id: socket.id,
        name: displayName,
        role: participant.role,
      })
      .returning('id');
    socket.participantDbId = row.id;
  } catch (err) {
    logger.error('Failed to store participant', err);
  }
}

async function resolveRoomAccess(roomId, userId) {
  await ensureVideoCallSchema();
  if (!roomId || !userId) {
    return { allowed: false, reason: 'missing_parameters' };
  }

  const user = await db('users')
    .select('id', 'full_name', 'email', 'role')
    .where({ id: userId })
    .first();

  if (!user) {
    return { allowed: false, reason: 'user_not_found' };
  }

  const roleRows = await db('user_roles')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('user_roles.user_id', userId)
    .select('roles.name as name');
  const roleList = roleRows.length
    ? roleRows.map((row) => row.name).filter(Boolean)
    : user.role
    ? [user.role]
    : [];
  const isAdmin = isAdminRole(roleList);

  const directCall = await db('video_calls')
    .select('caller_id', 'receiver_id')
    .where({ room_id: roomId })
    .orderBy('started_at', 'desc')
    .first();

  if (directCall) {
    const isCaller = directCall.caller_id === userId;
    const isReceiver = directCall.receiver_id === userId;
    return {
      allowed: isCaller || isReceiver || isAdmin,
      reason: 'not_part_of_call',
      nameFallback: user.full_name || user.email,
      role: isCaller ? 'host' : 'participant',
      type: 'direct-call',
      isInstructor: false,
      isAdmin,
    };
  }

  const cls = await db('online_classes')
    .select('id', 'instructor_id')
    .where({ id: roomId })
    .first();

  if (!cls) {
    return { allowed: false, reason: 'room_not_found' };
  }

  const isInstructor = cls.instructor_id === userId;
  let isStudent = false;
  if (!isInstructor) {
    const enrollment = await db('class_enrollments')
      .select('status')
      .where({ class_id: roomId, user_id: userId })
      .first();
    if (enrollment) {
      isStudent = !['cancelled', 'suspended'].includes(
        (enrollment.status || '').toLowerCase(),
      );
    }
  }

  const allowed = isInstructor || isStudent || isAdmin;

  return {
    allowed,
    reason: allowed ? null : 'not_enrolled',
    nameFallback: user.full_name || user.email || 'Participant',
    role: isInstructor || isAdmin ? 'host' : 'participant',
    type: 'class',
    isInstructor,
    isAdmin,
  };
}

function emitSessionStatus(io, roomId) {
  const session = state.sessions[roomId] || { live: false };
  io.to(roomId).emit('session-status', {
    roomId,
    ...session,
  });
}

async function markParticipantLeft({ roomId, socket }) {
  removeWaitingBySocket(socket.id);
  state.rooms[roomId] = (state.rooms[roomId] || []).filter(
    (id) => id !== socket.id,
  );
  state.participants[roomId] = (state.participants[roomId] || []).filter(
    (participant) => participant.id !== socket.id,
  );
  socket.to(roomId).emit('participant-left', { id: socket.id });

  if (state.handRaises[roomId]) {
    state.handRaises[roomId] = state.handRaises[roomId].filter(
      (entry) => entry.socketId !== socket.id && entry.userId !== socket.userId,
    );
    state.io.to(roomId).emit('hand-queue', {
      roomId,
      queue: state.handRaises[roomId],
    });
  }

  const breakoutState = state.breakouts[roomId];
  if (breakoutState) {
    delete breakoutState.assignments[socket.userId];
    delete breakoutState.activeMemberships[socket.userId];
    breakoutState.rooms = breakoutState.rooms.map((room) => ({
      ...room,
      members: room.members.filter((member) => member !== socket.userId),
    }));
    emitBreakoutUpdate(roomId);
  }

  if (!state.rooms[roomId]?.length) {
    clearRoomState(roomId);
  }

  try {
    if (socket.participantDbId) {
      await db('video_call_participants')
        .where({ id: socket.participantDbId })
        .update({ left_at: new Date() });
    }
  } catch (err) {
    logger.error('Failed to mark participant leave', err);
  }

  const stillHasHost = (state.participants[roomId] || []).some(
    (p) => p.role === 'host',
  );
  if (!stillHasHost && state.sessions[roomId]?.live) {
    state.sessions[roomId] = {
      live: false,
      startedAt: state.sessions[roomId]?.startedAt,
      endedAt: new Date().toISOString(),
    };
    emitSessionStatus(state.io, roomId);
  }
}

function initSockets(server, allowedOrigins) {
  state.io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
  });
  state.rooms = {};
  state.participants = {};
  state.userSockets = {};

  const { io, rooms, participants, userSockets } = state;

  io.on('connection', (socket) => {
    socket.on('register', ({ userId, role, roles }) => {
      if (!userId) return;
      userSockets[userId] = socket.id;
      socket.userId = userId;
      socket.userRole = role || null;
      socket.userRoles = roles || null;
    });

    socket.on('call-user', async ({ to, roomId, callId }) => {
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
            callId,
            name: caller?.full_name || '',
          });
        } catch (err) {
          logger.error('Failed to handle call-user event', err);
        }
      }
    });

    socket.on('call-accepted', ({ chatId, roomId, callId }) => {
      const target = userSockets[chatId];
      if (socket.userId && target) {
        io.to(target).emit('call-accepted', {
          chatId: socket.userId,
          roomId,
          callId,
        });
      }
    });

    socket.on('call-declined', ({ chatId, callId }) => {
      const target = userSockets[chatId];
      if (socket.userId && target) {
        io.to(target).emit('call-declined', {
          chatId: socket.userId,
          callId,
        });
      }
    });

    socket.on('call-cancelled', ({ chatId, callId }) => {
      const target = userSockets[chatId];
      if (socket.userId && target) {
        io.to(target).emit('call-cancelled', {
          chatId: socket.userId,
          callId,
        });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId && userSockets[socket.userId] === socket.id) {
        delete userSockets[socket.userId];
      }
    });

    socket.on('join-room', async ({ roomId, name }) => {
      if (!roomId) {
        socket.emit('join-denied', { reason: 'room_required' });
        return;
      }
      if (!socket.userId) {
        socket.emit('join-denied', { reason: 'auth_required' });
        return;
      }
      if (
        socket.currentRoomId === roomId &&
        (state.rooms[roomId] || []).includes(socket.id)
      ) {
        socket.emit('join-accepted', {
          roomId,
          role: findParticipant(roomId, (p) => p.id === socket.id)?.role || 'participant',
          session: state.sessions[roomId] || { live: false },
        });
        return;
      }
      if (socket.pendingRoomId === roomId) {
        socket.emit('join-pending', { roomId, requestId: socket.pendingRequestId });
        return;
      }

      try {
        const access = await resolveRoomAccess(roomId, socket.userId);
        if (!access.allowed) {
          socket.emit('join-denied', { roomId, reason: access.reason || 'forbidden' });
          return;
        }

        const resolvedRole = access.role || 'participant';
        const displayName = name || access.nameFallback || 'Participant';
        const autoAdmit = resolvedRole === 'host' || access.isAdmin;

        if (autoAdmit) {
          await admitParticipant({ roomId, socket, role: resolvedRole, displayName });
        } else {
          enqueueWaiting({ roomId, socket, displayName, role: resolvedRole });
        }
      } catch (err) {
        logger.error('Failed to handle join-room', err);
        socket.emit('join-denied', { roomId, reason: 'internal_error' });
      }

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

    socket.on('leave-room', async ({ roomId }) => {
        if (!roomId) return;
        if (socket.pendingRoomId === roomId) {
          removeWaitingEntry({ roomId, socketId: socket.id });
          delete socket.pendingRoomId;
          delete socket.pendingRequestId;
          socket.emit('join-denied', { roomId, reason: 'left_waiting' });
          return;
        }
        await markParticipantLeft({ roomId, socket });
        socket.leave(roomId);
      });

      socket.on('disconnect', async () => {
        Object.keys(rooms).forEach(async (roomKey) => {
          if (rooms[roomKey]?.includes(socket.id)) {
            socket.to(roomKey).emit('user-disconnected', socket.id);
            await markParticipantLeft({ roomId: roomKey, socket });
          }
        });
        if (socket.userId && userSockets[socket.userId] === socket.id) {
          delete userSockets[socket.userId];
        }
        removeWaitingBySocket(socket.id);
      });
    });
    socket.on('waiting-room:approve', async ({ roomId, requestId }) => {
      if (!roomId || !isHostLike(roomId, socket.id)) return;
      const entry = removeWaitingEntry({ roomId, requestId });
      if (!entry) return;
      const targetSocket = state.io?.sockets?.sockets?.get(entry.socketId);
      if (!targetSocket) return;
      delete targetSocket.pendingRoomId;
      delete targetSocket.pendingRequestId;
      try {
        await admitParticipant({
          roomId,
          socket: targetSocket,
          role: entry.role,
          displayName: entry.name,
        });
      } catch (err) {
        logger.error('Failed to approve waiting participant', err);
        targetSocket.emit('join-denied', { roomId, reason: 'internal_error' });
      }
    });

    socket.on('waiting-room:request', ({ roomId }) => {
      if (!roomId || !isHostLike(roomId, socket.id)) return;
      emitWaitingRoom(roomId);
    });

    socket.on('waiting-room:reject', ({ roomId, requestId }) => {
      if (!roomId || !isHostLike(roomId, socket.id)) return;
      const entry = removeWaitingEntry({ roomId, requestId });
      if (!entry) return;
      const targetSocket = state.io?.sockets?.sockets?.get(entry.socketId);
      if (targetSocket) {
        delete targetSocket.pendingRoomId;
        delete targetSocket.pendingRequestId;
        targetSocket.emit('join-denied', { roomId, reason: 'rejected' });
      }
    });

    socket.on('raise-hand', ({ roomId }) => {
      if (!roomId || socket.currentRoomId !== roomId) return;
      const participant = findParticipant(roomId, (p) => p.id === socket.id);
      if (!participant) return;
      const queue = getRoomArray(state.handRaises, roomId);
      if (queue.some((entry) => entry.userId === socket.userId)) return;
      const entry = {
        id: uuidv4(),
        userId: socket.userId,
        socketId: socket.id,
        name: participant.name,
        raisedAt: new Date().toISOString(),
      };
      queue.push(entry);
      state.io.to(roomId).emit('hand-queue', { roomId, queue });
    });

    socket.on('lower-hand', ({ roomId }) => {
      if (!roomId) return;
      const queue = state.handRaises[roomId];
      if (!queue) return;
      state.handRaises[roomId] = queue.filter(
        (entry) => entry.socketId !== socket.id && entry.userId !== socket.userId,
      );
      state.io.to(roomId).emit('hand-queue', {
        roomId,
        queue: state.handRaises[roomId],
      });
    });

    socket.on('hands-clear', ({ roomId }) => {
      if (!roomId || !isHostLike(roomId, socket.id)) return;
      state.handRaises[roomId] = [];
      state.io.to(roomId).emit('hand-queue', { roomId, queue: [] });
    });

    socket.on('hands-dismiss', ({ roomId, userId: targetUserId }) => {
      if (!roomId || !targetUserId || !isHostLike(roomId, socket.id)) return;
      const queue = state.handRaises[roomId];
      if (!queue) return;
      state.handRaises[roomId] = queue.filter((entry) => entry.userId !== targetUserId);
      state.io.to(roomId).emit('hand-queue', {
        roomId,
        queue: state.handRaises[roomId],
      });
    });

    socket.on('emoji-reaction', ({ roomId, emoji }) => {
      if (!roomId || !emoji) return;
      if (!(state.rooms[roomId] || []).includes(socket.id)) return;
      const participant = findParticipant(roomId, (p) => p.id === socket.id);
      state.io.to(roomId).emit('emoji-reaction', {
        roomId,
        id: uuidv4(),
        emoji,
        userId: socket.userId,
        name: participant?.name || 'Participant',
      });
    });

    socket.on('breakout-state-request', ({ roomId }) => {
      if (!roomId) return;
      emitBreakoutUpdate(roomId);
    });

    socket.on('breakout-create-room', ({ roomId, roomName }) => {
      if (!roomId || !roomName || !isHostLike(roomId, socket.id)) return;
      const breakout = getBreakoutState(roomId);
      if (!breakout.rooms.find((room) => room.name === roomName)) {
        breakout.rooms.push({ name: roomName, members: [] });
        emitBreakoutUpdate(roomId);
      }
    });

    socket.on('breakout-assign', ({ roomId, userId, roomName }) => {
      if (!roomId || !userId || !roomName || !isHostLike(roomId, socket.id)) return;
      const breakout = getBreakoutState(roomId);
      breakout.rooms = breakout.rooms.map((room) => ({
        ...room,
        members: room.members.filter((member) => member !== userId),
      }));
      let targetRoom = breakout.rooms.find((room) => room.name === roomName);
      if (!targetRoom) {
        targetRoom = { name: roomName, members: [] };
        breakout.rooms.push(targetRoom);
      }
      targetRoom.members = Array.from(new Set([...targetRoom.members, userId]));
      breakout.assignments[userId] = roomName;
      emitBreakoutUpdate(roomId);
    });

    socket.on('breakout-join', ({ roomId, roomName }) => {
      if (!roomId || socket.currentRoomId !== roomId) return;
      const breakout = getBreakoutState(roomId);
      breakout.activeMemberships[socket.userId] = roomName || breakout.assignments[socket.userId] || null;
      emitBreakoutUpdate(roomId);
    });

    socket.on('breakout-leave', ({ roomId }) => {
      if (!roomId) return;
      const breakout = state.breakouts[roomId];
      if (!breakout) return;
      delete breakout.activeMemberships[socket.userId];
      emitBreakoutUpdate(roomId);
    });
  });

  return state;
}

module.exports = { initSockets, state };
