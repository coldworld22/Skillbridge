jest.mock('../src/modules/users/admin/admin.service', () => ({
  updateAdminProfile: jest.fn(),
}));

const controller = require('../src/modules/users/admin/admin.controller');
const adminService = require('../src/modules/users/admin/admin.service');

describe('admin controller uploadIdentityDoc', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads identity document and upserts profile', async () => {
    const req = {
      user: { id: '1' },
      file: { filename: 'id.png' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.uploadIdentityDoc(req, res);

    expect(adminService.updateAdminProfile).toHaveBeenCalledWith('1', {
      identity_doc_url: '/uploads/admin/identity/id.png',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Identity document uploaded successfully',
      identity_doc_url: '/uploads/admin/identity/id.png',
    });
  });

  it('returns 400 when file is missing', async () => {
    const req = {
      user: { id: '1' },
      file: null,
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.uploadIdentityDoc(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'No identity file uploaded' });
    expect(adminService.updateAdminProfile).not.toHaveBeenCalled();
  });
});

