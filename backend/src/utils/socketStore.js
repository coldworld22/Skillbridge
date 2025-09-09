const redisClient = require('./redisClient');

const memoryStore = {
  userSockets: {},
  rooms: {},
  participants: {},
};

function isRedis() {
  return !!redisClient;
}

async function clearAll() {
  if (isRedis()) {
    const keys = await redisClient.keys('rooms:*');
    const participantKeys = await redisClient.keys('participants:*');
    if (keys.length) await redisClient.del(keys);
    if (participantKeys.length) await redisClient.del(participantKeys);
    await redisClient.del('userSockets');
  } else {
    memoryStore.userSockets = {};
    memoryStore.rooms = {};
    memoryStore.participants = {};
  }
}

// User sockets
async function addUserSocket(userId, socketId) {
  if (isRedis()) {
    await redisClient.hSet('userSockets', userId, socketId);
  } else {
    memoryStore.userSockets[userId] = socketId;
  }
}

async function getUserSocket(userId) {
  if (isRedis()) {
    return redisClient.hGet('userSockets', userId);
  }
  return memoryStore.userSockets[userId];
}

async function removeUserSocket(userId, socketId) {
  if (isRedis()) {
    const current = await redisClient.hGet('userSockets', userId);
    if (current === socketId) {
      await redisClient.hDel('userSockets', userId);
    }
  } else {
    if (memoryStore.userSockets[userId] === socketId) {
      delete memoryStore.userSockets[userId];
    }
  }
}

// Rooms and participants
async function addSocketToRoom(roomId, socketId, participant) {
  if (isRedis()) {
    await redisClient.sAdd(`rooms:${roomId}`, socketId);
    await redisClient.hSet(`participants:${roomId}`, socketId, JSON.stringify(participant));
  } else {
    memoryStore.rooms[roomId] = memoryStore.rooms[roomId] || [];
    memoryStore.rooms[roomId].push(socketId);
    memoryStore.participants[roomId] = memoryStore.participants[roomId] || [];
    memoryStore.participants[roomId].push(participant);
  }
}

async function getRoomSockets(roomId) {
  if (isRedis()) {
    const sockets = await redisClient.sMembers(`rooms:${roomId}`);
    return sockets;
  }
  return memoryStore.rooms[roomId] ? [...memoryStore.rooms[roomId]] : [];
}

async function getRoomParticipants(roomId) {
  if (isRedis()) {
    const participants = await redisClient.hGetAll(`participants:${roomId}`);
    return Object.values(participants).map((p) => JSON.parse(p));
  }
  return memoryStore.participants[roomId]
    ? memoryStore.participants[roomId].map((p) => ({ ...p }))
    : [];
}

async function removeSocketFromRoom(roomId, socketId) {
  if (isRedis()) {
    await redisClient.sRem(`rooms:${roomId}`, socketId);
    await redisClient.hDel(`participants:${roomId}`, socketId);
    const remaining = await redisClient.sCard(`rooms:${roomId}`);
    if (remaining === 0) {
      await redisClient.del(`rooms:${roomId}`);
      await redisClient.del(`participants:${roomId}`);
    }
  } else {
    if (!memoryStore.rooms[roomId]) return;
    memoryStore.rooms[roomId] = memoryStore.rooms[roomId].filter((id) => id !== socketId);
    memoryStore.participants[roomId] = memoryStore.participants[roomId].filter(
      (p) => p.id !== socketId,
    );
    if (!memoryStore.rooms[roomId].length) {
      delete memoryStore.rooms[roomId];
      delete memoryStore.participants[roomId];
    }
  }
}

module.exports = {
  clearAll,
  addUserSocket,
  getUserSocket,
  removeUserSocket,
  addSocketToRoom,
  getRoomSockets,
  getRoomParticipants,
  removeSocketFromRoom,
};
