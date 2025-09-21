const knex = require('knex');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'test-refresh-secret';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';

const mockDb = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
});

jest.mock('../src/config/database', () => mockDb);

const db = require('../src/config/database');
const controller = require('../src/modules/users/admin/admin.controller');

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

describe('admin.controller getProfile', () => {
  beforeEach(async () => {
    await db.schema.dropTableIfExists('user_social_links');
    await db.schema.dropTableIfExists('admin_profiles');
    await db.schema.dropTableIfExists('users');

    await db.schema.createTable('users', (table) => {
      table.increments('id');
      table.string('full_name');
      table.string('email');
      table.string('phone');
      table.string('gender');
      table.date('date_of_birth');
      table.string('avatar_url');
      table.boolean('is_email_verified');
      table.boolean('is_phone_verified');
      table.boolean('profile_complete').defaultTo(false);
      table.timestamp('created_at');
      table.timestamp('updated_at');
    });

    await db.schema.createTable('admin_profiles', (table) => {
      table.increments('id');
      table.integer('user_id').notNullable();
      table.string('job_title');
      table.string('department');
      table.string('identity_doc_url');
      table.timestamp('created_at');
      table.timestamp('updated_at');
    });

    await db.schema.createTable('user_social_links', (table) => {
      table.increments('id');
      table.integer('user_id').notNullable();
      table.string('platform').notNullable();
      table.string('url').notNullable();
      table.timestamp('created_at');
    });
  });

  afterAll(async () => {
    await db.schema.dropTableIfExists('user_social_links');
    await db.schema.dropTableIfExists('admin_profiles');
    await db.schema.dropTableIfExists('users');
    await db.destroy();
  });

  it('returns user data when admin profile is missing', async () => {
    const userId = 1;
    await db('users').insert({
      id: userId,
      full_name: 'Test Admin',
      email: 'admin@example.com',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const req = { user: { id: userId } };
    const res = createRes();

    await controller.getProfile(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      id: userId,
      full_name: 'Test Admin',
      email: 'admin@example.com',
      social_links: [],
    });
    expect(res.body).not.toHaveProperty('job_title');
  });
});
