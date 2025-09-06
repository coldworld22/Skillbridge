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
  it('removes room data after last participant leaves', () => {
    const server = http.createServer();
    initSockets(server, []);
    const { io, rooms, participants } = state;
    const socket = new MockSocket('s1');
    const connectionHandler = io.listeners('connection')[0];
    connectionHandler(socket);
    socket.emit('join-room', { roomId: 'room1', name: 'Alice' });

    expect(rooms['room1']).toEqual(['s1']);
    expect(participants['room1']).toHaveLength(1);

    socket.emit('disconnect');

    expect(rooms['room1']).toBeUndefined();
    expect(participants['room1']).toBeUndefined();
  });
});
