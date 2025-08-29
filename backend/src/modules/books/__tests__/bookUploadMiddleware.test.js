const upload = require('../bookUploadMiddleware');
const { fileFilter } = upload;

describe('bookUploadMiddleware fileFilter', () => {
  const runFilter = (fieldname, mimetype) => {
    let error, accept;
    fileFilter(null, { fieldname, mimetype }, (err, ok) => {
      error = err;
      accept = ok;
    });
    return { error, accept };
  };

  test('rejects non-image for cover_image', () => {
    const { error, accept } = runFilter('cover_image', 'application/pdf');
    expect(error).toBeInstanceOf(Error);
    expect(accept).toBe(false);
  });

  test('rejects non-image for preview_pages', () => {
    const { error, accept } = runFilter('preview_pages', 'application/pdf');
    expect(error).toBeInstanceOf(Error);
    expect(accept).toBe(false);
  });

  test('rejects non-pdf for book_file', () => {
    const { error, accept } = runFilter('book_file', 'image/jpeg');
    expect(error).toBeInstanceOf(Error);
    expect(accept).toBe(false);
  });
});
