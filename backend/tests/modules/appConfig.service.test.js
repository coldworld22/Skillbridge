jest.mock("../../src/utils/logger.js", () => ({
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../src/config/database", () => {
  const fn = jest.fn();
  fn.fn = { now: jest.fn(() => "now()") };
  return fn;
});

const db = require("../../src/config/database");
const logger = require("../../src/utils/logger.js");
const service = require("../../src/modules/appConfig/appConfig.service");

const undefinedTableError = () => {
  const error = new Error('relation "settings" does not exist');
  error.code = "42P01";
  error.message = 'relation "settings" does not exist';
  return error;
};

describe("appConfig.service", () => {
  beforeEach(() => {
    db.mockReset();
    db.fn = { now: jest.fn(() => "now()") };
    logger.warn.mockClear();
    logger.error.mockClear();
  });

  test("getSettings returns an empty object when settings table is missing", async () => {
    db.mockImplementationOnce(() => ({
      where: () => ({
        first: () => Promise.reject(undefinedTableError()),
      }),
    }));

    const result = await service.getSettings();
    expect(result).toEqual({});
    expect(logger.warn).toHaveBeenCalled();
  });

  test("updateSettings surfaces a helpful error if the settings table is missing", async () => {
    db.mockImplementation(() => ({
      where: () => ({
        first: () => Promise.reject(undefinedTableError()),
      }),
    }));

    await expect(service.updateSettings({})).rejects.toMatchObject({
      statusCode: 503,
    });
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("settingsStore")
    );
  });
});
