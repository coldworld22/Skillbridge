const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

const db = newDb();
db.public.registerFunction({
  name: 'uuid_generate_v4',
  returns: 'uuid',
  implementation: uuidv4,
});

const mockDb = db.adapters.createKnex();

jest.mock('../../../../config/database', () => mockDb);

const service = require('../tutorial.service');
const { TUTORIAL_STATUS } = require('../../../../../shared/tutorialStatus');

describe('tutorial.service getAllTutorials approval filter', () => {
  let instructorId;

  beforeAll(async () => {
    await mockDb.schema.createTable('users', (table) => {
      table.uuid('id').primary();
      table.string('full_name');
    });

    await mockDb.schema.createTable('categories', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.string('image_url');
    });

    await mockDb.schema.createTable('tutorials', (table) => {
      table.uuid('id').primary();
      table.string('title');
      table.text('description');
      table.string('status');
      table.string('moderation_status');
      table.uuid('instructor_id').references('users.id');
      table.integer('category_id').references('categories.id');
      table.timestamp('created_at').defaultTo(mockDb.fn.now());
    });
  });

  afterAll(async () => {
    await mockDb.destroy();
  });

  beforeEach(async () => {
    await mockDb('tutorials').del();
    await mockDb('users').del();
    await mockDb('categories').del();

    instructorId = uuidv4();

    await mockDb('users').insert({ id: instructorId, full_name: 'Instructor' });
    await mockDb('categories').insert({ id: 1, name: 'Category', image_url: null });

    const now = Date.now();

    await mockDb('tutorials').insert([
      {
        id: uuidv4(),
        title: 'Approved tutorial',
        description: 'A published tutorial',
        status: TUTORIAL_STATUS.PUBLISHED,
        moderation_status: 'Approved',
        instructor_id: instructorId,
        category_id: 1,
        created_at: new Date(now - 3000).toISOString(),
      },
      {
        id: uuidv4(),
        title: 'Rejected tutorial',
        description: 'A rejected tutorial',
        status: TUTORIAL_STATUS.PUBLISHED,
        moderation_status: 'Rejected',
        instructor_id: instructorId,
        category_id: 1,
        created_at: new Date(now - 2000).toISOString(),
      },
      {
        id: uuidv4(),
        title: 'Pending tutorial',
        description: 'A pending tutorial',
        status: TUTORIAL_STATUS.PUBLISHED,
        moderation_status: 'Pending',
        instructor_id: instructorId,
        category_id: 1,
        created_at: new Date(now - 1000).toISOString(),
      },
      {
        id: uuidv4(),
        title: 'Draft tutorial',
        description: 'A draft tutorial awaiting review',
        status: TUTORIAL_STATUS.DRAFT,
        moderation_status: null,
        instructor_id: instructorId,
        category_id: 1,
        created_at: new Date(now).toISOString(),
      },
    ]);
  });

  test('approval "Approved" returns only approved tutorials and metadata', async () => {
    const result = await service.getAllTutorials({ approval: 'Approved', page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].moderation_status).toBe('Approved');
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
  });

  test('approval "Rejected" returns only rejected tutorials and metadata', async () => {
    const result = await service.getAllTutorials({ approval: 'Rejected', page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].moderation_status).toBe('Rejected');
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
  });

  test('approval "Pending" includes drafts without moderation status', async () => {
    const result = await service.getAllTutorials({ approval: 'Pending', page: 1, limit: 10 });

    const statuses = result.data.map((item) => item.moderation_status);
    expect(statuses).toEqual(expect.arrayContaining(['Pending', null]));
    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(result.meta.totalPages).toBe(1);
  });
});
