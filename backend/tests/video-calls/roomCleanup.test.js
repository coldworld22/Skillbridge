const EventEmitter = require('events');
const http = require('http');

jest.mock('../../src/config/database', () => {
  const mockImpl = (table) => {
    switch (table) {
      case 'users':
        return {
          select: () => ({
            where: () => ({
              first: () =>
                Promise.resolve({
                  id: 'user1',
                  full_name: 'Instructor',
                  role: 'instructor',
                  roles: ['instructor'],
                }),
            }),
          }),
        };
      case 'video_calls':
        return {
          select: () => ({
            where: () => ({
              orderBy: () => ({
                first: () => Promise.resolve(null),
              }),
            }),
          }),
        };
      case 'online_classes':
        return {
          select: () => ({
            where: () => ({
              first: () =>
                Promise.resolve({
                  id: 'room1',
                  instructor_id: 'user1',
                }),
            }),
          }),
        };
      case 'class_enrollments':
        return {
          select: () => ({
            where: () => ({
              first: () => Promise.resolve(null),
            }),
          }),
          where: () => ({
            first: () => Promise.resolve(null),
          }),
        };
      case 'user_roles':
        return {
          leftJoin: () => ({
            where: () => ({
              select: () => Promise.resolve([]),
            }),
          }),
        };
      case 'video_call_participants':
        return {
          insert: () => ({
            returning: () => Promise.resolve([{ id: 1 }]),
          }),
          where: () => ({
            andWhere: () => ({
              first: () => Promise.resolve({ role: 'host' }),
            }),
            update: () => Promise.resolve(),
          }),
        };
      default:
        return {
          insert: () => ({
            returning: () => Promise.resolve([{ id: 1 }]),
          }),
          where: () => ({
            update: () => Promise.resolve(),
          }),
        };
    }
  };
  return jest.fn(mockImpl);
});

const { initSockets, state } = require('../../src/sockets');

class MockSocket extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
  }
  join() {}
  to() {
    return { emit: () => {} };
  }
}

describe('room cleanup', () => {
  it('removes room data after last participant leaves', async () => {
    const server = http.createServer();
    initSockets(server, []);
    const { io, rooms, participants } = state;
    const socket = new MockSocket('s1');
    const connectionHandler = io.listeners('connection')[0];
    connectionHandler(socket);
    socket.emit('register', { userId: 'user1' });
    socket.emit('join-room', { roomId: 'room1', name: 'Alice' });
    await new Promise((resolve) => setImmediate(resolve));

    expect(rooms['room1']).toEqual(['s1']);
    expect(participants['room1']).toHaveLength(1);

    socket.emit('disconnect');
    await new Promise((resolve) => setImmediate(resolve));

    expect(rooms['room1']).toBeUndefined();
    expect(participants['room1']).toBeUndefined();
  });
});
