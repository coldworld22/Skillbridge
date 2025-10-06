import axios from 'axios';

import appConfigHandler from '@/pages/api/app-config';
import policiesHandler from '@/pages/api/policies';
import classRosterHandler from '@/pages/api/classes/[classId]/students';
import classRosterStudentHandler from '@/pages/api/classes/[classId]/students/[studentId]';
import tutorialAnalyticsHandler from '@/pages/api/tutorials/[id]/analytics';

jest.mock('axios');

const createResponse = () => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
  };

  return response;
};

describe('API routes base URL fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.INTERNAL_API_BASE_URL;
  });

  it('app-config handler uses fallback URL', async () => {
    axios.get.mockResolvedValue({ data: {} });

    const req = { method: 'GET', headers: {} };
    const res = createResponse();

    await appConfigHandler(req, res);

    expect(axios.get).toHaveBeenCalledWith('http://localhost:5002/api/app-config', {
      headers: {},
      withCredentials: true,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('policies handler uses fallback URL', async () => {
    axios.get.mockResolvedValue({ data: {} });

    const req = { method: 'GET', headers: {} };
    const res = createResponse();

    await policiesHandler(req, res);

    expect(axios.get).toHaveBeenCalledWith('http://localhost:5002/api/policies', {
      headers: {},
      withCredentials: true,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('class roster handler uses fallback URL', async () => {
    axios.get.mockResolvedValue({ data: {} });

    const req = { query: { classId: '123' } };
    const res = createResponse();

    await classRosterHandler(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:5002/api/users/classes/admin/123/students'
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('class roster student handler uses fallback URL', async () => {
    axios.get.mockResolvedValue({ data: {} });

    const req = { query: { classId: '123', studentId: '456' } };
    const res = createResponse();

    await classRosterStudentHandler(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:5002/api/users/classes/admin/123/students/456'
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('tutorial analytics handler uses fallback URL', async () => {
    axios.get.mockResolvedValue({ data: { data: {} } });

    const req = { query: { id: 'abc' }, headers: {} };
    const res = createResponse();

    await tutorialAnalyticsHandler(req, res);

    expect(axios.get).toHaveBeenCalledWith(
      'http://localhost:5002/api/users/tutorials/admin/abc/analytics',
      {
        headers: {},
        withCredentials: true,
      }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
