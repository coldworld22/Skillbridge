jest.mock('child_process', () => ({
  execFile: jest.fn(),
}));

jest.mock('../../../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../../appConfig/appConfig.service', () => ({
  getSettings: jest.fn().mockResolvedValue({}),
  updateSettings: jest.fn().mockResolvedValue(),
}));

jest.mock('../../emailConfig/emailConfig.service', () => ({
  getSettings: jest.fn().mockResolvedValue({}),
  updateSettings: jest.fn().mockResolvedValue(),
}));

jest.mock('../install.helpers', () => ({
  markAdminExists: jest.fn(),
  refreshAdminPresence: jest.fn().mockResolvedValue(),
}));

const { execFile } = require('child_process');

const flushPromises = () => new Promise(setImmediate);

describe('install.controller runInstall', () => {
  beforeEach(() => {
    delete process.env.MODE;
    execFile.mockReset();
    execFile.mockImplementation((file, args, options, callback) => {
      callback(null, '', '');
    });
  });

  it('passes START_DEV_SERVICES=false to the installer script', async () => {
    const { runInstall } = require('../install.controller');

    const req = {
      body: {
        adminEmail: 'admin@example.com',
        adminPassword: 'supersecret',
        appName: 'SkillBridge',
      },
    };

    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const res = { status, json };

    await runInstall(req, res);
    await flushPromises();

    expect(execFile).toHaveBeenCalledTimes(1);
    const call = execFile.mock.calls[0];
    const options = call[2];
    expect(options).toBeDefined();
    expect(options.env).toMatchObject({
      START_DEV_SERVICES: 'false',
      MODE: 'development',
    });
  });
});
