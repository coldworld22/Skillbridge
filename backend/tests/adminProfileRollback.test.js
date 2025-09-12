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

describe('updateProfile transaction', () => {
  beforeEach(async () => {
    await db.schema.dropTableIfExists('user_social_links');
    await db.schema.dropTableIfExists('admin_profiles');
    await db.schema.dropTableIfExists('users');

    await db.schema.createTable('users', (table) => {
      table.increments('id');
      table.string('email');
      table.string('full_name');
      table.string('phone');
      table.string('gender');
      table.date('date_of_birth');
      table.string('avatar_url');
      table.boolean('profile_complete').defaultTo(false);
      table.timestamp('updated_at');
    });

    await db.schema.createTable('admin_profiles', (table) => {
      table.increments('id');
      table.integer('user_id').notNullable();
      table.string('job_title');
      table.string('department');
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

    await db('users').insert({
      id: 1,
      email: 'old@example.com',
      full_name: 'Old Name',
      profile_complete: false,
    });
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('rolls back if social link insertion fails', async () => {
    const req = {
      user: { id: 1 },
      body: {
        full_name: 'New Name',
        email: 'new@example.com',
        phone: '123',
        gender: 'M',
        date_of_birth: '1990-01-01',
        avatar_url: 'avatar.png',
        job_title: 'Boss',
        department: 'Dept',
        social_links: [{ platform: null, url: 'http://example.com' }],
      },
    };
    const res = createRes();
    await controller.updateProfile(req, res);

    expect(res.statusCode).toBe(500);
    const user = await db('users').where({ id: 1 }).first();
    expect(user.full_name).toBe('Old Name');
    expect(user.profile_complete).toBe(0);
    const profiles = await db('admin_profiles').where({ user_id: 1 });
    expect(profiles).toHaveLength(0);
    const links = await db('user_social_links').where({ user_id: 1 });
    expect(links).toHaveLength(0);
  });
});

