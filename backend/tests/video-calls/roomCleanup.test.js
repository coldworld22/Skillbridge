const EventEmitter = require('events');

process.env.JWT_SECRET = 'test';
process.env.REFRESH_TOKEN_SECRET = 'test';

jest.mock('../../src/config/database', () => {
  const fn = jest.fn(() => ({
    insert: () => ({ returning: () => Promise.resolve([{ id: 1 }]) }),
    where: () => ({ update: () => Promise.resolve() }),
  }));
  fn.migrate = { latest: () => Promise.resolve() };
  return fn;
});

jest.mock('../../src/config/passport', () => ({
  passport: {
    initialize: () => (_req, _res, next) => next(),
    authenticate: () => (_req, _res, next) => next(),
  },
  initStrategies: jest.fn(),
}));

jest.mock('../../src/jobs/lessonReminderJob', () => jest.fn());
jest.mock('../../src/jobs/lessonLiveJob', () => ({ startLessonLiveJob: jest.fn() }));
jest.mock('../../src/jobs/cartReminderJob', () => jest.fn());
jest.mock('../../src/jobs/classReminderJob', () => jest.fn());
jest.mock('../../src/jobs/cleanupJob', () => jest.fn());
jest.mock('../../src/jobs/contributorStatsJob', () => jest.fn());

const { io, rooms, participants } = require('../../src/server');

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
