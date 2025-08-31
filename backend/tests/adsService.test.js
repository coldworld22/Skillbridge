const { newDb } = require('pg-mem');

const db = newDb();
// Register minimal uuid_generate_v4 to satisfy migrations if needed
const { v4: uuidv4 } = require('uuid');
db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid', implementation: uuidv4 });

const mockDb = db.adapters.createKnex();

jest.mock('../src/config/database.js', () => mockDb);

const service = require('../src/modules/ads/ads.service');

let userId;

describe('ads.service getAds', () => {
  beforeAll(async () => {
    await mockDb.schema.createTable('users', (table) => {
      table.uuid('id').primary();
    });
    await mockDb.schema.createTable('ads', (table) => {
      table.uuid('id').primary();
      table.string('title').notNullable();
      table.string('image_url');
      table.uuid('created_by').notNullable().references('users.id');
      table.boolean('is_active').notNullable().defaultTo(false);
      table.specificType('target_roles', 'text[]').defaultTo('{}');
      table.specificType('start_at', 'timestamptz');
      table.specificType('end_at', 'timestamptz');
      table.timestamp('created_at').defaultTo(mockDb.fn.now());
    });
  });

  afterAll(async () => {
    await mockDb.destroy();
  });

  beforeEach(async () => {
    await mockDb('ads').del();
    await mockDb('users').del();
    userId = uuidv4();
    await mockDb('users').insert({ id: userId });
  });

  it('returns ads with null or empty target_roles for any audience', async () => {
    const adNull = uuidv4();
    const adEmpty = uuidv4();
    const adOther = uuidv4();
    await mockDb('ads').insert([
      { id: adNull, title: 'Null', image_url: 'a.jpg', created_by: userId, is_active: true, target_roles: null },
      { id: adEmpty, title: 'Empty', image_url: 'b.jpg', created_by: userId, is_active: true, target_roles: [] },
      { id: adOther, title: 'Other', image_url: 'c.jpg', created_by: userId, is_active: true, target_roles: ['instructor'] },
    ]);

    const { data: ads } = await service.getAds(
      false,
      undefined,
      'student',
      false,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
    const ids = ads.map((a) => a.id).sort();
    const expected = [adEmpty, adNull].sort();
    expect(ids).toEqual(expected);
  });

});
