const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

const db = newDb();
db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid', implementation: uuidv4 });
const mockDb = db.adapters.createKnex();

jest.mock('../src/config/database.js', () => mockDb);

const service = require('../src/modules/users/student/student.service');

describe('student.service updateStudentProfile', () => {
  beforeAll(async () => {
    await mockDb.schema.createTable('users', (table) => {
      table.uuid('id').primary();
      table.string('full_name');
      table.string('phone');
      table.string('gender');
      table.date('date_of_birth');
      table.boolean('profile_complete').defaultTo(false);
    });

    await mockDb.schema.createTable('student_profiles', (table) => {
      table.uuid('user_id').primary().references('users.id');
      table.string('education_level');
      table.string('topics');
      table.string('learning_goals');
    });

    await mockDb.schema.createTable('user_social_links', (table) => {
      table.increments('id');
      table.uuid('user_id').references('users.id');
      table.string('platform');
      table.string('url');
    });
  });

  afterAll(async () => {
    await mockDb.destroy();
  });

  beforeEach(async () => {
    await mockDb('user_social_links').del();
    await mockDb('student_profiles').del();
    await mockDb('users').del();
  });

  it('updates profile, social links and marks profile complete', async () => {
    const userId = uuidv4();
    await mockDb('users').insert({ id: userId });

    await service.updateStudentProfile(
      userId,
      { full_name: 'John', phone: '123', gender: 'male', date_of_birth: '2000-01-01' },
      { education_level: 'college', topics: 'math', learning_goals: 'learn' },
      [
        { platform: 'github', url: 'github.com/john' },
        { platform: 'invalid', url: 'http://example.com' },
      ]
    );

    const user = await mockDb('users').where({ id: userId }).first();
    expect(user.profile_complete).toBe(true);
    expect(user.full_name).toBe('John');

    const profile = await mockDb('student_profiles').where({ user_id: userId }).first();
    expect(profile.education_level).toBe('college');

    const links = await mockDb('user_social_links').where({ user_id: userId });
    expect(links).toHaveLength(1);
    expect(links[0].platform).toBe('github');
    expect(links[0].url).toBe('https://github.com/john');
  });
});

