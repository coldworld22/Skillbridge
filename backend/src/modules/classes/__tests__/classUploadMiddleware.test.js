const upload = require('../classUploadMiddleware');
const { fileFilter, generateFilename } = upload;

const runFilter = (fieldname, mimetype, originalname) => {
  let error, accept;
  fileFilter(null, { fieldname, mimetype, originalname }, (err, ok) => {
    error = err;
    accept = ok;
  });
  return { error, accept };
};

describe('classUploadMiddleware', () => {
  test('rejects non-image for cover_image', () => {
    const { error, accept } = runFilter('cover_image', 'video/mp4', 'test.mp4');
    expect(error).toBeInstanceOf(Error);
    expect(accept).toBe(false);
  });

  test('rejects non-video for demo_video', () => {
    const { error, accept } = runFilter('demo_video', 'image/png', 'test.png');
    expect(error).toBeInstanceOf(Error);
    expect(accept).toBe(false);
  });

  test('sanitizes filenames', () => {
    const savedName = generateFilename('my file#name.png');
    expect(savedName).not.toMatch(/[\s#]/);
  });
});
