const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

const db = newDb();
db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid', implementation: uuidv4 });
const mockDb = db.adapters.createKnex();

jest.mock('../src/config/database.js', () => mockDb);

const service = require('../src/modules/users/instructor/instructor.service');

describe('instructor.service updateInstructorProfile', () => {
  beforeAll(async () => {
    await mockDb.schema.createTable('users', (table) => {
      table.uuid('id').primary();
      table.string('full_name');
      table.string('phone');
      table.string('gender');
      table.date('date_of_birth');
      table.boolean('profile_complete').defaultTo(false);
    });
    await mockDb.schema.createTable('instructor_profiles', (table) => {
      table.uuid('user_id').primary().references('users.id');
      table.text('expertise');
      table.integer('experience');
      table.text('bio');
      table.text('certifications');
      table.float('pricing');
      table.string('demo_video_url');
    });
    await mockDb.schema.createTable('user_social_links', (table) => {
      table.increments('id').primary();
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
    await mockDb('instructor_profiles').del();
    await mockDb('users').del();
  });

  it('marks profile as complete when all required fields are provided', async () => {
    const userId = uuidv4();
    await mockDb('users').insert({ id: userId });

    await service.updateInstructorProfile(
      userId,
      { full_name: 'John Doe', phone: '123', gender: 'male', date_of_birth: '1990-01-01' },
      { experience: 5, expertise: ['Math'], bio: 'Teacher', pricing: 50 },
      [{ platform: 'facebook', url: 'facebook.com/johndoe' }]
    );

    const user = await mockDb('users').where({ id: userId }).first();
    expect(user.profile_complete).toBe(true);
  });

  it('marks profile as incomplete when missing bio', async () => {
    const userId = uuidv4();
    await mockDb('users').insert({ id: userId });

    await service.updateInstructorProfile(
      userId,
      { full_name: 'Jane Doe', phone: '456', gender: 'female', date_of_birth: '1992-02-02' },
      { experience: 3, expertise: ['Science'], pricing: 75 },
      [{ platform: 'facebook', url: 'facebook.com/janedoe' }]
    );

    const user = await mockDb('users').where({ id: userId }).first();
    expect(user.profile_complete).toBe(false);
  });
});
