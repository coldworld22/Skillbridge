jest.mock('../src/config/database', () => {
  const mockDb = jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockRejectedValue(new Error('relation "settings" does not exist')),
  }));
  return mockDb;
});

const service = require('../src/modules/socialLoginConfig/socialLoginConfig.service');

describe('socialLoginConfigService.getSettings', () => {
  it('returns null when settings table is missing', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.getSettings();

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load social login settings',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});

