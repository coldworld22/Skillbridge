const EventEmitter = require('events');
const http = require('http');

jest.mock('../../src/config/database', () => {
  const fn = jest.fn(() => ({
    insert: () => ({ returning: () => Promise.resolve([{ id: 1 }]) }),
    where: () => ({ update: () => Promise.resolve() }),
  }));
  return fn;
});

const { initSockets, state } = require('../../src/sockets');
const store = require('../../src/utils/socketStore');

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
  beforeEach(async () => {
    await store.clearAll();
  });

  it('removes room data after last participant leaves', async () => {
    const server = http.createServer();
    initSockets(server, []);
    const { io } = state;
    const socket = new MockSocket('s1');
    const connectionHandler = io.listeners('connection')[0];
    connectionHandler(socket);
    socket.emit('join-room', { roomId: 'room1', name: 'Alice' });
    await new Promise((r) => setImmediate(r));

    expect(await store.getRoomSockets('room1')).toEqual(['s1']);
    expect((await store.getRoomParticipants('room1')).length).toBe(1);

    socket.emit('disconnect');
    await new Promise((r) => setImmediate(r));

    expect(await store.getRoomSockets('room1')).toEqual([]);
    expect(await store.getRoomParticipants('room1')).toEqual([]);
  });
});
