const { newDb } = require('pg-mem');

const db = newDb();
// Minimal uuid implementation for pg-mem
const { v4: uuidv4 } = require('uuid');
db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid', implementation: uuidv4 });

// Support DATE() calls used in analytics queries
db.public.registerFunction({
  name: 'date',
  args: ['timestamptz'],
  returns: 'date',
  implementation: (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()),
});

const mockDb = db.adapters.createKnex();

jest.mock('../src/config/database.js', () => mockDb);

const service = require('../src/modules/ads/ads.service');

describe('ads.service getAdAnalytics', () => {
  let adId;

  beforeAll(async () => {
    await mockDb.schema.createTable('ad_views', (table) => {
      table.increments('id').primary();
      table.uuid('ad_id').notNullable();
      table.uuid('user_id');
      table.timestamp('viewed_at').defaultTo(mockDb.fn.now());
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
    adId = uuidv4();

    await mockDb('ad_views').insert([
      {
        ad_id: adId,
        user_id: uuidv4(),
        viewed_at: new Date('2024-01-01T10:00:00Z'),
        ip_address: 'ip1',
        user_agent: 'Chrome',
        location: 'USA',
      },
      {
        ad_id: adId,
        user_id: uuidv4(),
        viewed_at: new Date('2024-01-01T12:00:00Z'),
        ip_address: 'ip2',
        user_agent: 'Chrome',
        location: 'USA',
      },
      {
        ad_id: adId,
        user_id: null,
        viewed_at: new Date('2024-01-02T15:00:00Z'),
        ip_address: 'ip3',
        user_agent: 'Firefox',
        location: 'Canada',
      },
    ]);

    await mockDb('ad_analytics').insert({
      ad_id: adId,
      views: 3,
      clicks: 1,
      ctr: null,
      unique_viewers: 2,
    });
  });

  afterAll(async () => {
    await mockDb.destroy();
  });

  it('returns aggregated analytics with computed ctr', async () => {
    const analytics = await service.getAdAnalytics(adId);

    expect(analytics.views).toBe(3);
    expect(analytics.clicks).toBe(1);
    expect(analytics.unique_viewers).toBe(2);
    expect(analytics.ctr).toBeCloseTo((1 / 3) * 100);

    expect(analytics.devices).toEqual([
      { user_agent: 'Chrome', views: 2 },
      { user_agent: 'Firefox', views: 1 },
    ]);

    expect(analytics.ip_stats).toHaveLength(3);
    expect(analytics.ip_stats).toEqual(
      expect.arrayContaining([
        { ip_address: 'ip1', views: 1 },
        { ip_address: 'ip2', views: 1 },
        { ip_address: 'ip3', views: 1 },
      ])
    );

    expect(analytics.location_stats).toEqual(
      expect.arrayContaining([
        { country: 'USA', views: 2 },
        { country: 'Canada', views: 1 },
      ])
    );

    expect(analytics.analytics.map((d) => d.day.toISOString().slice(0, 10))).toEqual([
      '2024-01-01',
      '2024-01-02',
    ]);
  });
});

