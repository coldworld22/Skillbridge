import axios from 'axios';
import listHandler from '@/pages/api/classes/[classId]/students';
import detailHandler from '@/pages/api/classes/[classId]/students/[studentId]';

jest.mock('axios');

describe('classes students proxy handlers', () => {
  const OLD_ENV = process.env;

  const createMockRes = () => {
    return {
      statusCode: undefined,
      jsonBody: undefined,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.jsonBody = payload;
        return this;
      },
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...OLD_ENV,
      NEXT_PUBLIC_API_BASE_URL: 'http://example.com/api',
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns students list when provided a session cookie', async () => {
    axios.get.mockResolvedValue({ data: { data: [{ id: 'student-1' }] } });

    const req = {
      method: 'GET',
      query: { classId: 'class-123' },
      headers: { cookie: 'session=valid' },
    };
    const res = createMockRes();

    await listHandler(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      'http://example.com/api/users/classes/admin/class-123/students',
      {
        withCredentials: true,
        headers: { Cookie: 'session=valid' },
      }
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual([{ id: 'student-1' }]);
  });

  it('returns a single student when provided a session cookie', async () => {
    axios.get.mockResolvedValue({ data: { data: { id: 'student-2' } } });

    const req = {
      method: 'GET',
      query: { classId: 'class-789', studentId: 'student-2' },
      headers: { cookie: 'session=valid' },
    };
    const res = createMockRes();

    await detailHandler(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      'http://example.com/api/users/classes/admin/class-789/students/student-2',
      {
        withCredentials: true,
        headers: { Cookie: 'session=valid' },
      }
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ id: 'student-2' });
  });
});
