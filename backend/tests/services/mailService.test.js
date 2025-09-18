jest.mock('../../src/modules/emailConfig/emailConfig.service', () => ({
  getSettings: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../src/utils/email', () => ({
  createTransporter: jest.fn(),
}));

jest.mock('../../src/utils/logger.js', () => ({
  log: jest.fn(),
  error: jest.fn(),
}));

const { createTransporter } = require('../../src/utils/email');
const logger = require('../../src/utils/logger.js');
const mailService = require('../../src/services/mailService');

describe('mailService.sendMail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns early when transporter is unavailable', async () => {
    createTransporter.mockResolvedValue(null);

    await expect(
      mailService.sendMail({
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
      }),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      'Emails disabled. Email to user@test.com not sent.',
    );
  });
});
