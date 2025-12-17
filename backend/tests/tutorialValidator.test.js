const validator = require('../src/modules/users/tutorials/tutorial.validator');

describe('tutorial validator', () => {
  test('allows relative paths for media fields', () => {
    const sample = {
      body: {
        title: 'Test Tutorial',
        category_id: 'cat',
        level: 'beginner',
        chapters: JSON.stringify([
          { title: 'Intro', order: 1, video_url: '/uploads/tutorials/chapters/admin/video.mp4' }
        ]),
        cover_image: '/uploads/tutorials/thumb.png',
        preview_video: '/uploads/tutorials/preview.mp4'
      }
    };

    expect(() => validator.create.body.parse(sample.body)).not.toThrow();
  });

  test('treats empty numeric fields as optional', () => {
    const sample = {
      body: {
        title: 'Optional Fields',
        category_id: 'cat',
        level: 'beginner',
        price: '',
        duration: '',
        chapters: JSON.stringify([
          { title: 'Intro', order: 1, duration: '', video_url: '/uploads/tutorials/chapters/admin/video.mp4' }
        ])
      }
    };

    expect(() => validator.create.body.parse(sample.body)).not.toThrow();
  });

  test('coerces numeric strings and nulls in chapters', () => {
    const sample = {
      body: {
        title: 'Coerce Chapter Order',
        category_id: 'cat',
        level: 'beginner',
        chapters: JSON.stringify([
          { title: 'One', order: '1', duration: null, video_url: '/uploads/tutorials/chapters/admin/video.mp4' },
          { title: 'Two', order: 2, duration: '5', video_url: '/uploads/tutorials/chapters/admin/video2.mp4' }
        ])
      }
    };

    expect(() => validator.create.body.parse(sample.body)).not.toThrow();
  });
});
