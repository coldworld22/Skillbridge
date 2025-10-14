const ORIGINAL_ENV = process.env.NEXT_PUBLIC_API_BASE_URL;

describe("buildUrl", () => {
  afterEach(() => {
    jest.resetModules();
    if (ORIGINAL_ENV === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = ORIGINAL_ENV;
    }
  });

  test("returns null for falsy values", () => {
    jest.resetModules();
    const { buildUrl } = require("./url");
    expect(buildUrl(null)).toBeNull();
    expect(buildUrl(undefined)).toBeNull();
    expect(buildUrl("")).toBeNull();
  });

  test("handles absolute URLs", () => {
    jest.resetModules();
    const { buildUrl } = require("./url");
    expect(buildUrl("https://example.com/image.png")).toBe("https://example.com/image.png");
  });

  test("extracts url from object inputs", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/api";
    jest.resetModules();
    const { buildUrl } = require("./url");
    expect(buildUrl({ url: "/uploads/books/book.pdf" })).toBe(
      "https://api.example.com/api/uploads/books/book.pdf"
    );
  });

  test("falls back to localized values inside objects", () => {
    jest.resetModules();
    const { buildUrl } = require("./url");
    expect(
      buildUrl({
        en: "/images/default-book-cover.jpg",
        fr: "/images/livre.jpg",
      })
    ).toBe("/images/default-book-cover.jpg");
  });

  test("reads nested arrays until it finds a usable value", () => {
    jest.resetModules();
    const { buildUrl } = require("./url");
    expect(buildUrl([null, { href: "https://example.com/file" }])).toBe("https://example.com/file");
  });
});
