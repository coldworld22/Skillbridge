const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

const db = newDb();
// pg-mem doesn't include uuid_generate_v4 by default
db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid', implementation: uuidv4 });

const mockDb = db.adapters.createKnex();

jest.mock('../../../config/database', () => mockDb);

const service = require('../class.service');

// helper to normalize tag field from query
const normalizeTags = (cls) => (typeof cls.tags === 'string' ? JSON.parse(cls.tags) : cls.tags);

describe.skip('class.service tag aggregation', () => {
  let instructorId;
  let class1Id;
  let class2Id;

  beforeAll(async () => {
    await mockDb.schema.createTable('users', (table) => {
      table.uuid('id').primary();
      table.string('full_name');
    });
    await mockDb.schema.createTable('categories', (table) => {
      table.increments('id').primary();
      table.string('name');
    });
    await mockDb.schema.createTable('online_classes', (table) => {
      table.uuid('id').primary();
      table.string('title');
      table.string('slug');
      table.string('cover_image');
      table.timestamp('start_date');
      table.timestamp('end_date');
      table.float('price');
      table.string('status');
      table.string('moderation_status');
      table.uuid('instructor_id').references('users.id');
      table.integer('category_id').references('categories.id');
      table.integer('max_students');
      table.timestamp('created_at').defaultTo(mockDb.fn.now());
    });
    await mockDb.schema.createTable('class_tags', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.string('slug');
    });
    await mockDb.schema.createTable('class_tag_map', (table) => {
      table.uuid('class_id').references('online_classes.id');
      table.integer('tag_id').references('class_tags.id');
    });
    await mockDb.schema.createTable('class_views', (table) => {
      table.uuid('class_id');
    });
  });

  afterAll(async () => {
    await mockDb.destroy();
  });

  beforeEach(async () => {
    await mockDb('class_tag_map').del();
    await mockDb('class_tags').del();
    await mockDb('online_classes').del();
    await mockDb('users').del();
    await mockDb('categories').del();
    await mockDb('class_views').del();

    instructorId = uuidv4();
    class1Id = uuidv4();
    class2Id = uuidv4();
    await mockDb('users').insert({ id: instructorId, full_name: 'Teacher' });
    await mockDb('categories').insert({ id: 1, name: 'Cat' });
    await mockDb('online_classes').insert([
      { id: class1Id, title: 'C1', slug: 'c1', instructor_id: instructorId, category_id: 1, status: 'draft', moderation_status: 'Pending' },
      { id: class2Id, title: 'C2', slug: 'c2', instructor_id: instructorId, category_id: 1, status: 'draft', moderation_status: 'Pending' },
    ]);
    await mockDb('class_tags').insert([
      { id: 1, name: 'Tag1', slug: 'tag1' },
      { id: 2, name: 'Tag2', slug: 'tag2' },
    ]);
    await mockDb('class_tag_map').insert([
      { class_id: class1Id, tag_id: 1 },
      { class_id: class1Id, tag_id: 2 },
      { class_id: class2Id, tag_id: 1 },
    ]);
  });

  test('getAllClasses aggregates tags', async () => {
    const res = await service.getAllClasses();
    const c1 = res.data.find((c) => c.id === class1Id);
    const tags = normalizeTags(c1);
    expect(tags).toHaveLength(2);
    const names = tags.map((t) => t.name).sort();
    expect(names).toEqual(['Tag1', 'Tag2']);
  });

  test('getClassById returns tags', async () => {
    const cls = await service.getClassById(class1Id);
    const tags = normalizeTags(cls);
    expect(tags).toHaveLength(2);
    expect(tags.map((t) => t.id).sort()).toEqual([1, 2]);
  });

  test('getClassesByInstructor aggregates tags', async () => {
    const res = await service.getClassesByInstructor(instructorId);
    const c2 = res.data.find((c) => c.id === class2Id);
    const tags = normalizeTags(c2);
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe('Tag1');
  });

  test('pagination returns correct metadata', async () => {
    const res = await service.getAllClasses({ page: 1, limit: 1 });
    expect(res.data).toHaveLength(1);
    expect(res.meta.total).toBe(2);
    expect(res.meta.totalPages).toBe(2);
  });

  test('pagination works for instructor classes', async () => {
    const res = await service.getClassesByInstructor(instructorId, { page: 2, limit: 1 });
    expect(res.data).toHaveLength(1);
    expect(res.meta.total).toBe(2);
    expect(res.meta.page).toBe(2);
  });
});
