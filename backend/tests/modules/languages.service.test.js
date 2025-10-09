jest.mock("../../src/utils/logger.js", () => ({
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../src/config/database", () => {
  const fn = jest.fn();
  fn.fn = { now: jest.fn(() => "now()") };
  fn.transaction = jest.fn((handler) => handler({
    insert: jest.fn(),
    update: jest.fn(),
    returning: jest.fn(() => [{ id: 1 }]),
  }));
  return fn;
});

const db = require("../../src/config/database");
const logger = require("../../src/utils/logger.js");
const service = require("../../src/modules/languages/languages.service");

const undefinedTableError = () => {
  const error = new Error('relation "languages" does not exist');
  error.code = "42P01";
  error.message = 'relation "languages" does not exist';
  return error;
};

describe("languages.service", () => {
  beforeEach(() => {
    db.mockReset();
    db.fn = { now: jest.fn(() => "now()") };
    logger.warn.mockClear();
  });

  test("list returns an empty array when the languages table has not been created", async () => {
    db.mockImplementationOnce(() => ({
      select: () => ({
        orderBy: () => Promise.reject(undefinedTableError()),
      }),
    }));

    const result = await service.list();
    expect(result).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("languages.list")
    );
  });

  test("getById returns null when the languages table is missing", async () => {
    db.mockImplementationOnce(() => ({
      where: () => ({
        first: () => Promise.reject(undefinedTableError()),
      }),
    }));

    const result = await service.getById("1");
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("languages.getById")
    );
  });

  test("list rethrows unexpected database errors", async () => {
    const boom = Object.assign(new Error("boom"), { code: "XX" });
    db.mockImplementationOnce(() => ({
      select: () => ({
        orderBy: () => Promise.reject(boom),
      }),
    }));

    await expect(service.list()).rejects.toThrow(boom);
  });
});
