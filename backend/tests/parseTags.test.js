const { parseTags } = require('../src/modules/users/tutorials/tutorial.helpers');
const AppError = require('../src/utils/AppError');

describe('parseTags', () => {
  test('returns array when input is array', () => {
    const input = ['js', 'node'];
    expect(parseTags(input)).toEqual(input);
  });

  test('parses valid JSON string', () => {
    const input = '["js","node"]';
    expect(parseTags(input)).toEqual(['js', 'node']);
  });

  test('returns empty array when input is undefined', () => {
    expect(parseTags(undefined)).toEqual([]);
  });

  test('throws AppError on invalid JSON string', () => {
    expect(() => parseTags('not json')).toThrow(AppError);
  });

  test('throws AppError when JSON is not an array', () => {
    expect(() => parseTags('{"a":1}')).toThrow(AppError);
    expect(() => parseTags({ a: 1 })).toThrow(AppError);
  });
});
