const validator = require('../class.validator');

const base = {
  instructor_id: '00000000-0000-0000-0000-000000000000',
  title: 'Test Class'
};

describe('class validator date handling', () => {
  test('rejects invalid start_date', () => {
    const result = validator.create.safeParse({
      body: { ...base, start_date: 'not-a-date' }
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid end_date', () => {
    const result = validator.create.safeParse({
      body: { ...base, end_date: '32/13/2024' }
    });
    expect(result.success).toBe(false);
  });

  test('rejects end_date earlier than start_date', () => {
    const result = validator.create.safeParse({
      body: {
        ...base,
        start_date: '2024-05-10',
        end_date: '2024-05-01'
      }
    });
    expect(result.success).toBe(false);
  });

  test('accepts valid dates in order', () => {
    const result = validator.create.safeParse({
      body: {
        ...base,
        start_date: '2024-05-01',
        end_date: '2024-05-10'
      }
    });
    expect(result.success).toBe(true);
  });
});
