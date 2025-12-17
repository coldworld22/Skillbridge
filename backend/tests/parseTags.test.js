const { parseTags, parseChapters } = require('../src/modules/users/tutorials/tutorial.helpers');
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

describe('parseChapters', () => {
  test('returns empty array for invalid input', () => {
    expect(parseChapters('not-json')).toEqual([]);
    expect(parseChapters({})).toEqual([]);
  });

  test('normalizes numeric fields and defaults order', () => {
    const raw = JSON.stringify([
      { title: 'Intro', order: '', duration: '5', video_url: '/path/vid.mp4', is_preview: 'true' },
      { title: 'Second', video_url: '/path/vid2.mp4', duration: null, is_preview: 'false' },
    ]);
    const chapters = parseChapters(raw);
    expect(chapters).toEqual([
      {
        title: 'Intro',
        content: undefined,
        video_url: '/path/vid.mp4',
        duration: 5,
        order: 1,
        is_preview: true,
      },
      {
        title: 'Second',
        content: undefined,
        video_url: '/path/vid2.mp4',
        duration: undefined,
        order: 2,
        is_preview: false,
      },
    ]);
  });
});
