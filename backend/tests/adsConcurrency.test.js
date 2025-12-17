const { newDb } = require('pg-mem');

const db = newDb();
// Minimal uuid function for pg-mem
const { v4: uuidv4 } = require('uuid');
db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid', implementation: uuidv4 });

const mockDb = db.adapters.createKnex();

jest.mock('../src/config/database.js', () => mockDb);

const service = require('../src/modules/ads/ads.service');

describe('ads.service concurrency', () => {
  let adId;

  beforeAll(async () => {
    // Create minimal tables needed for analytics
    await mockDb.schema.createTable('ads', (table) => {
      table.uuid('id').primary();
    });

    await mockDb.schema.createTable('ad_views', (table) => {
      table.increments('id').primary();
      table.uuid('ad_id').notNullable();
      table.uuid('user_id');
      table.string('ip_address');
      table.text('user_agent');
      table.string('location');
    });

    await mockDb.schema.createTable('ad_analytics', (table) => {
      table.uuid('ad_id').primary();
      table.integer('views').defaultTo(0);
      table.integer('clicks').defaultTo(0);
      table.float('ctr').defaultTo(0);
      table.integer('unique_viewers').defaultTo(0);
    });
  });

  beforeEach(async () => {
    await mockDb('ad_views').del();
    await mockDb('ad_analytics').del();
    await mockDb('ads').del();
    adId = uuidv4();
    await mockDb('ads').insert({ id: adId });
  });

  afterAll(async () => {
    await mockDb.destroy();
  });

  it('handles concurrent views without losing updates', async () => {
    const views = Array.from({ length: 10 }, (_, i) =>
      service.recordView(adId, null, `ip${i}`, 'ua')
    );
    await Promise.all(views);

    const row = await mockDb('ad_analytics').where({ ad_id: adId }).first();
    expect(Number(row.views)).toBe(10);
    expect(Number(row.unique_viewers)).toBe(10);
  });

  it('handles concurrent clicks without losing updates', async () => {
    await mockDb('ad_analytics').insert({ ad_id: adId, views: 10, clicks: 0, ctr: 0, unique_viewers: 0 });

    const clicks = Array.from({ length: 10 }, () => service.recordClick(adId));
    await Promise.all(clicks);

    const row = await mockDb('ad_analytics').where({ ad_id: adId }).first();
    expect(Number(row.clicks)).toBe(10);
    expect(Number(row.views)).toBe(10);
    expect(Number(row.ctr)).toBe(100);
  });
});

