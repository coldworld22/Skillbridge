const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('../book.service', () => ({
  createBook: jest.fn(),
  updateBook: jest.fn(),
  getBookById: jest.fn(),
  clearBookTags: jest.fn(),
  listBooks: jest.fn(),
  updateBookTags: jest.fn(),
}));
jest.mock('../book.utils', () => ({
  processTags: jest.fn(() => []),
}));

jest.mock('../../notifications/notifications.service', () => ({
  createNotification: jest.fn(),
}));
jest.mock('../../messages/messages.service', () => ({
  createMessage: jest.fn(),
}));
jest.mock('../../../services/mailService', () => ({
  sendMail: jest.fn(),
}));
jest.mock('../../users/user.model', () => ({
  findAdmins: jest.fn(),
  findInstructors: jest.fn(),
  findStudents: jest.fn(),
  findContactInfo: jest.fn(),
}));
jest.mock('../../../utils/response', () => ({
  sendSuccess: jest.fn(),
}));

const controller = require('../book.controller');
const service = require('../book.service');
const { sendSuccess } = require('../../../utils/response');

const makeFiles = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-test-'));
  const files = ['cover.jpg', 'book.pdf', 'preview.jpg'].map((name) => {
    const filePath = path.join(dir, name);
    fs.writeFileSync(filePath, 'data');
    return filePath;
  });
  return {
    dir,
    paths: files,
    files: {
      cover_image: [{ path: files[0], filename: path.basename(files[0]) }],
      book_file: [{ path: files[1], filename: path.basename(files[1]) }],
      preview_pages: [{ path: files[2], filename: path.basename(files[2]) }],
    },
  };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('book.controller file cleanup', () => {
  test('createBook removes uploaded files on error', async () => {
    const { dir, paths, files } = makeFiles();
    service.createBook.mockRejectedValue(new Error('fail'));
    const req = { body: {}, files, user: { id: 1 } };
    const res = {};
    const next = jest.fn((err) => {
      paths.forEach((p) => expect(fs.existsSync(p)).toBe(false));
    });

    await new Promise((resolve) => {
      controller.createBook(req, res, (err) => {
        next(err);
        resolve();
      });
    });

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('updateBook removes uploaded files on error', async () => {
    const { dir, paths, files } = makeFiles();
    service.getBookById.mockResolvedValue({ id: 1, instructor_id: 1 });
    service.updateBook.mockRejectedValue(new Error('fail'));
    const req = { params: { id: 1 }, body: {}, files, user: { id: 1, role: 'instructor' } };
    const res = {};
    const next = jest.fn((err) => {
      paths.forEach((p) => expect(fs.existsSync(p)).toBe(false));
    });

    await new Promise((resolve) => {
      controller.updateBook(req, res, (err) => {
        next(err);
        resolve();
      });
    });

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('book.controller access control', () => {
  test('listBooks enforces active status filter for public requests', async () => {
    service.listBooks.mockResolvedValue({ data: [], meta: {} });

    const res = {};
    await controller.listBooks(
      { query: { status: 'pending', search: 'drafts' } },
      res,
      jest.fn()
    );

    expect(service.listBooks).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'drafts', status: 'active' })
    );
    expect(service.listBooks.mock.calls[0][0].status).toBe('active');
    expect(sendSuccess).toHaveBeenCalledTimes(1);
    const [passedRes, data, message, meta] = sendSuccess.mock.calls[0];
    expect(passedRes).toBe(res);
    expect(data).toEqual([]);
    expect(message).toBe('Books fetched');
    expect(meta).toEqual({});
  });

  test('instructors cannot change status via updateBook', async () => {
    service.getBookById.mockResolvedValue({ id: 1, instructor_id: 'inst-1' });
    service.updateBook.mockResolvedValue({ id: 1, title: 'Updated' });
    service.updateBookTags.mockResolvedValue([]);

    const req = {
      params: { id: 1 },
      body: { status: 'active', title: 'Updated' },
      files: {},
      user: { id: 'inst-1', role: 'instructor' },
    };

    await controller.updateBook(req, {}, jest.fn());

    const [, payload] = service.updateBook.mock.calls[0];
    expect(payload).not.toHaveProperty('status');
    expect(payload).toMatchObject({ title: 'Updated' });
  });
});
