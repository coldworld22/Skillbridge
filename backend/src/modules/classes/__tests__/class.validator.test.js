jest.mock('../../../config/database', () => {
  const plans = {
    'student-id': { id: 'student-id', slug: 'student-slug', target_role: 'student' },
    'student-slug': { id: 'student-id', slug: 'student-slug', target_role: 'student' },
    'inst-id': { id: 'inst-id', slug: 'inst-slug', target_role: 'instructor' },
    'inst-slug': { id: 'inst-id', slug: 'inst-slug', target_role: 'instructor' }
  };
  return jest.fn(() => ({
    where(cond) {
      this.key = cond.id || cond.slug;
      return this;
    },
    first() {
      return Promise.resolve(plans[this.key] || null);
    }
  }));
});

const validator = require('../class.validator');

const base = {
  instructor_id: '00000000-0000-0000-0000-000000000000',
  title: 'Test Class'
};

describe('class validator date handling', () => {
  test('rejects invalid start_date', async () => {
    const result = await validator.create.body.safeParseAsync({
      ...base,
      start_date: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid end_date', async () => {
    const result = await validator.create.body.safeParseAsync({
      ...base,
      end_date: '32/13/2024',
    });
    expect(result.success).toBe(false);
  });

  test('rejects end_date earlier than start_date', async () => {
    const result = await validator.create.body.safeParseAsync({
      ...base,
      start_date: '2024-05-10',
      end_date: '2024-05-01',
    });
    expect(result.success).toBe(false);
  });

  test('accepts valid dates in order', async () => {
    const result = await validator.create.body.safeParseAsync({
      ...base,
      start_date: '2024-05-01',
      end_date: '2024-05-10',
    });
    expect(result.success).toBe(true);
  });
});

describe('included_plans validation', () => {
  test('accepts existing student plan', async () => {
    const result = await validator.create.body.safeParseAsync({
      ...base,
      included_plans: ['student-id'],
    });
    expect(result.success).toBe(true);
  });

  test('rejects non-student plan', async () => {
    const result = await validator.create.body.safeParseAsync({
      ...base,
      included_plans: ['inst-id'],
    });
    expect(result.success).toBe(false);
  });

  test('requires included plans when access type is free', async () => {
    const result = await validator.create.body.safeParseAsync({
      ...base,
      access_type: 'free',
    });
    expect(result.success).toBe(false);
  });

  test('rejects student plans on paid classes', async () => {
    const result = await validator.create.body.safeParseAsync({
      ...base,
      access_type: 'paid',
      included_plans: ['student-id'],
    });
    expect(result.success).toBe(false);
  });
});
