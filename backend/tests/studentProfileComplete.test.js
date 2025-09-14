jest.mock('../src/config/database', () => {
  const data = {
    users: [],
    student_profiles: [],
    user_social_links: [],
  };

  const createQuery = (table, ctx) => {
    const arr = ctx[table];
    return {
      _where: null,
      where(cond) {
        this._where = cond;
        return this;
      },
      select(...cols) {
        const results = arr.filter((r) =>
          !this._where ||
          Object.entries(this._where).every(([k, v]) => r[k] === v)
        );
        return results.map((r) => {
          if (cols.length === 0) return { ...r };
          return cols.reduce((o, c) => ({ ...o, [c]: r[c] }), {});
        });
      },
      first() {
        const results = arr.filter((r) =>
          !this._where ||
          Object.entries(this._where).every(([k, v]) => r[k] === v)
        );
        return Promise.resolve(results[0]);
      },
      update(upd) {
        arr.forEach((r) => {
          if (
            !this._where ||
            Object.entries(this._where).every(([k, v]) => r[k] === v)
          ) {
            Object.assign(r, upd);
          }
        });
        return Promise.resolve();
      },
      insert(obj) {
        arr.push(obj);
        return Promise.resolve();
      },
      del() {
        for (let i = arr.length - 1; i >= 0; i--) {
          const r = arr[i];
          if (
            this._where &&
            Object.entries(this._where).every(([k, v]) => r[k] === v)
          ) {
            arr.splice(i, 1);
          }
        }
        return Promise.resolve();
      },
    };
  };

  const db = (table) => createQuery(table, data);
  db.__data = data;
  db.transaction = jest.fn(async () => {
    const local = JSON.parse(JSON.stringify(data));
    const trx = (table) => createQuery(table, local);
    trx.commit = jest.fn().mockImplementation(async () => {
      Object.keys(data).forEach((k) => {
        data[k] = JSON.parse(JSON.stringify(local[k]));
      });
    });
    trx.rollback = jest.fn().mockResolvedValue();
    return trx;
  });
  return db;
});

const controller = require('../src/modules/users/student/student.controller');
const db = require('../src/config/database');

jest.mock('../src/utils/logger.js', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

describe('Student profile completeness', () => {
  let res;
  beforeEach(() => {
    db.__data.users = [
      {
        id: 'user1',
        full_name: null,
        phone: null,
        gender: null,
        date_of_birth: null,
        profile_complete: false,
      },
    ];
    db.__data.student_profiles = [];
    db.__data.user_social_links = [];
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it('sets profile_complete true for full payload', async () => {
    const req = {
      user: { id: 'user1' },
      body: {
        full_name: 'John Doe',
        phone: '12345678',
        gender: 'male',
        date_of_birth: '2000-01-01',
        education_level: 'College',
        topics: ['math'],
        learning_goals: 'Learn',
        social_links: [{ platform: 'twitter', url: 'twitter.com/john' }],
      },
    };

    await controller.updateProfile(req, res);

    expect(db.__data.users[0].profile_complete).toBe(true);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ profile_complete: true })
    );
  });

  it('sets profile_complete false for partial payload', async () => {
    const req = {
      user: { id: 'user1' },
      body: {
        full_name: 'John Doe',
        phone: '12345678',
        gender: 'male',
        date_of_birth: '2000-01-01',
        education_level: 'College',
        topics: ['math'],
        learning_goals: 'Learn',
        social_links: [],
      },
    };

    await controller.updateProfile(req, res);

    expect(db.__data.users[0].profile_complete).toBe(false);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ profile_complete: false })
    );
  });
});
