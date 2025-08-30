const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

const db = newDb();
db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid', implementation: uuidv4 });
const mockDb = db.adapters.createKnex();

jest.mock('../../../../config/database', () => mockDb);

const service = require('../classEnrollment.service');

describe('classEnrollment.service capacity', () => {
  beforeAll(async () => {
    await mockDb.schema.createTable('class_enrollments', (table) => {
      table.uuid('id').primary();
      table.uuid('user_id');
      table.uuid('class_id');
      table.string('status');
      table.timestamp('enrolled_at');
    });
  });

  afterAll(async () => {
    await mockDb.destroy();
  });

  beforeEach(async () => {
    await mockDb('class_enrollments').del();
  });

  test('countEnrollments ignores cancelled', async () => {
    const classId = uuidv4();
    await mockDb('class_enrollments').insert([
      { id: uuidv4(), user_id: uuidv4(), class_id: classId, status: 'enrolled' },
      { id: uuidv4(), user_id: uuidv4(), class_id: classId, status: 'cancelled' },
    ]);
    const count = await service.countEnrollments(classId);
    expect(count).toBe(1);
  });

  test('capacity updates when cancelling and re-enrolling', async () => {
    const classId = uuidv4();
    const userId = uuidv4();
    await mockDb('class_enrollments').insert({
      id: uuidv4(),
      user_id: userId,
      class_id: classId,
      status: 'enrolled',
    });
    let count = await service.countEnrollments(classId);
    expect(count).toBe(1);

    await service.updateEnrollment(userId, classId, { status: 'cancelled' });
    count = await service.countEnrollments(classId);
    expect(count).toBe(0);

    await service.updateEnrollment(userId, classId, { status: 'enrolled' });
    count = await service.countEnrollments(classId);
    expect(count).toBe(1);
  });
});
