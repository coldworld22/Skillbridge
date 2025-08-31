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

    expect(() => validator.create.parse(sample)).not.toThrow();
  });
});
