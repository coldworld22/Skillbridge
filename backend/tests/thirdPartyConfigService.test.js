jest.mock('../src/config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn();
  db.update = jest.fn().mockResolvedValue();
  db.insert = jest.fn().mockResolvedValue();
  db.fn = { now: jest.fn(() => 'now') };
  return db;
});

const db = require('../src/config/database');
const service = require('../src/modules/thirdPartyConfig/thirdPartyConfig.service');

describe('thirdPartyConfig.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('removes recaptcha from stored settings when retrieving', async () => {
    db.first
      .mockResolvedValueOnce({ value: JSON.stringify({ recaptcha: { siteKey: 'k' }, other: 1 }) })
      .mockResolvedValueOnce({ key: 'third_party_settings' });
    const settings = await service.getSettings();
    expect(settings).toEqual({ other: 1 });
    expect(db.where).toHaveBeenCalledWith({ key: 'third_party_settings' });
    expect(db.update).toHaveBeenCalledWith({ value: JSON.stringify({ other: 1 }), updated_at: expect.anything() });
  });

  it('ignores recaptcha during update', async () => {
    db.first
      .mockResolvedValueOnce({ value: JSON.stringify({}) }) // getSettings inside updateSettings
      .mockResolvedValueOnce({ value: JSON.stringify({}) }) // getSettings inside updateSettings -> writeJsonSetting first check
      .mockResolvedValueOnce({ key: 'third_party_settings' }); // existing record for update

    const res = await service.updateSettings({ recaptcha: { siteKey: 'k' }, other: 2 });
    expect(res).toEqual({ other: 2 });
    expect(db.update).toHaveBeenCalledWith({ value: JSON.stringify({ other: 2 }), updated_at: expect.anything() });
    expect(db.insert).not.toHaveBeenCalled();
  });
});
