jest.mock('../src/config/database', () => {
  const update = jest.fn();
  const where = jest.fn(() => ({ update }));
  const db = jest.fn(() => ({ where }));
  db.update = update;
  db.where = where;
  return db;
});

const controller = require('../src/modules/users/admin/admin.controller');
const mockDb = require('../src/config/database');

describe('admin controller updateAvatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows user to update their own avatar', async () => {
    const req = {
      params: { id: '1' },
      user: { id: '1' },
      file: { filename: 'avatar.png' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.updateAvatar(req, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(mockDb).toHaveBeenCalledWith('users');
    expect(mockDb.where).toHaveBeenCalledWith({ id: '1' });
    expect(mockDb.update).toHaveBeenCalledWith({
      avatar_url: '/uploads/admin/avatars/avatar.png',
      updated_at: expect.any(Date),
    });
    expect(res.json).toHaveBeenCalledWith({
      message: 'Avatar updated',
      avatar_url: '/uploads/admin/avatars/avatar.png',
    });
  });

  it('rejects updates to another user\'s avatar', async () => {
    const req = {
      params: { id: '2' },
      user: { id: '1' },
      file: { filename: 'avatar.png' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.updateAvatar(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    expect(mockDb).not.toHaveBeenCalled();
  });
});
