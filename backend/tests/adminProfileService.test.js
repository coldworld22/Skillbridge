const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

const db = newDb();
db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid', implementation: uuidv4 });
const mockDb = db.adapters.createKnex();

jest.mock('../src/config/database.js', () => mockDb);

const service = require('../src/modules/users/admin/admin.service');

describe('admin.service updateAdminProfile', () => {
  beforeAll(async () => {
    await mockDb.schema.createTable('users', (table) => {
      table.uuid('id').primary();
    });
    await mockDb.schema.createTable('admin_profiles', (table) => {
      table.uuid('user_id').primary().references('users.id');
      table.string('identity_doc_url');
      table.timestamps(true, true);
    });
  });

  afterAll(async () => {
    await mockDb.destroy();
  });

  beforeEach(async () => {
    await mockDb('admin_profiles').del();
    await mockDb('users').del();
  });

  it('inserts a profile when none exists', async () => {
    const userId = uuidv4();
    await mockDb('users').insert({ id: userId });

    await service.updateAdminProfile(userId, { identity_doc_url: '/uploads/admin/identity/doc.pdf' });

    const profile = await mockDb('admin_profiles').where({ user_id: userId }).first();
    expect(profile).toBeTruthy();
    expect(profile.identity_doc_url).toBe('/uploads/admin/identity/doc.pdf');
  });
});

