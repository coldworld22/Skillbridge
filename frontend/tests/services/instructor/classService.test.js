import api from '@/services/api/api';
import { ensureCsrfToken } from '@/services/api/csrf';
import { createInstructorClass } from '@/services/instructor/classService';

jest.mock('@/services/api/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

jest.mock('@/services/api/csrf', () => ({
  ensureCsrfToken: jest.fn(),
}));

describe('createInstructorClass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts the class payload and returns formatted class data', async () => {
    ensureCsrfToken.mockResolvedValue('csrf-token');
    const apiResponse = {
      data: {
        data: {
          id: 42,
          title: 'New Class',
          status: 'draft',
          trending: 0,
          cover_image: null,
          demo_video_url: null,
          instructor_image: null,
          start_date: null,
          end_date: null,
          views: 5,
        },
      },
    };
    api.post.mockResolvedValue(apiResponse);

    const payload = new FormData();
    const onUploadProgress = jest.fn();

    const result = await createInstructorClass(payload, onUploadProgress);

    expect(ensureCsrfToken).toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledWith(
      'users/classes/instructor',
      payload,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'multipart/form-data',
          'x-csrf-token': 'csrf-token',
        }),
        onUploadProgress,
      }),
    );
    expect(result).toMatchObject({
      id: 42,
      title: 'New Class',
      publishStatus: 'draft',
      trending: false,
      start_date: null,
      end_date: null,
      views: 5,
    });
  });

  it('returns null when API responds without data', async () => {
    ensureCsrfToken.mockResolvedValue('csrf-token');
    api.post.mockResolvedValue({ data: {} });

    const result = await createInstructorClass(new FormData());

    expect(result).toBeNull();
  });
});
