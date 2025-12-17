const ORIGINAL_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

describe("formatBook", () => {
  afterEach(() => {
    if (ORIGINAL_API_BASE === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = ORIGINAL_API_BASE;
    }
    jest.resetModules();
  });

  it("parses JSON-encoded cover image paths", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/api";
    jest.resetModules();
    const { formatBook } = await import("@/services/bookService");
    const formatted = formatBook({
      cover_image_url: '["/uploads/books/cover-a.jpg","/uploads/books/cover-b.jpg"]',
    });
    expect(formatted.coverUrl).toEqual(expect.stringContaining("/uploads/books/cover-a.jpg"));
    expect(formatted.cover_image_url).toEqual(expect.stringContaining("/uploads/books/cover-a.jpg"));
  });
});
