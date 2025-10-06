import api from "../../services/api/api";
import {
  fetchBooks,
  fetchBook,
  updateBook,
  createBook,
} from "../../services/bookService";

jest.mock("../../services/api/api", () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("bookService", () => {
  it("fetches books", async () => {
    const apiData = [{ id: 1, title: "A" }];
    const meta = { total: 1 };
    api.get.mockResolvedValueOnce({ data: { data: apiData, meta } });
    const res = await fetchBooks({
      page: 2,
      perPage: 5,
      filters: { search: "test", category: "c1", priceRange: 25 },
      sort: { sortBy: "title" },
    });
    expect(api.get).toHaveBeenCalledWith("books", {
      params: {
        page: 2,
        perPage: 5,
        search: "test",
        category: "c1",
        priceRange: 25,
        sortBy: "title",
        status: "active",
      },
    });
    expect(res).toEqual({
      books: [
        {
          id: 1,
          title: "A",
          cover_image_url: null,
          pdf_url: null,
          preview_url: null,
          preview_pages: [],
        },
      ],
      meta,
    });
  });

  it("fetches books as admin", async () => {
    const apiData = [{ id: 1, title: "A" }];
    const meta = { total: 1 };
    api.get.mockResolvedValueOnce({ data: { data: apiData, meta } });
    const res = await fetchBooks({ admin: true });
    expect(api.get).toHaveBeenCalledWith("books/admin", { params: {} });
    expect(res).toEqual({
      books: [
        {
          id: 1,
          title: "A",
          cover_image_url: null,
          pdf_url: null,
          preview_url: null,
          preview_pages: [],
        },
      ],
      meta,
    });
  });

  it("fetches single book", async () => {
    const apiData = { id: 1, title: "A" };
    api.get.mockResolvedValueOnce({ data: { data: apiData } });
    const book = await fetchBook(1);
    expect(api.get).toHaveBeenCalledWith("books/1");
    expect(book).toEqual({
      id: 1,
      title: "A",
      cover_image_url: null,
      pdf_url: null,
      preview_url: null,
      preview_pages: [],
    });
  });

  it("fetches single book as admin", async () => {
    const apiData = { id: 1, title: "A" };
    api.get.mockResolvedValueOnce({ data: { data: apiData } });
    const book = await fetchBook(1, { admin: true });
    expect(api.get).toHaveBeenCalledWith("books/admin/1");
    expect(book).toEqual({
      id: 1,
      title: "A",
      cover_image_url: null,
      pdf_url: null,
      preview_url: null,
      preview_pages: [],
    });
  });

  it("falls back to public endpoint if admin fetch fails", async () => {
    const apiData = { id: 1, title: "A" };
    api.get
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ data: { data: apiData } });
    const book = await fetchBook(1, { admin: true });
    expect(api.get).toHaveBeenNthCalledWith(1, "books/admin/1");
    expect(api.get).toHaveBeenNthCalledWith(2, "books/1");
    expect(book).toEqual({
      id: 1,
      title: "A",
      cover_image_url: null,
      pdf_url: null,
      preview_url: null,
      preview_pages: [],
    });
  });

  it("normalizes price and parses preview pages", async () => {
    const apiData = {
      id: 3,
      price: "19.99",
      preview_pages: '["/uploads/a.png"]',
      preview_url: "/uploads/p.pdf",
    };
    api.get.mockResolvedValueOnce({ data: { data: apiData } });
    const book = await fetchBook(3);
    expect(book).toEqual({
      id: 3,
      price: 19.99,
      cover_image_url: null,
      pdf_url: null,
      preview_url: "/uploads/p.pdf",
      preview_pages: ["/uploads/a.png"],
    });
  });

  it("falls back to first preview page when preview_url is missing", async () => {
    const apiData = {
      id: 4,
      allow_preview: true,
      preview_pages: ["/uploads/a.png", "/uploads/b.png"],
    };
    api.get.mockResolvedValueOnce({ data: { data: apiData } });
    const book = await fetchBook(4);
    expect(book.preview_pages).toEqual(["/uploads/a.png", "/uploads/b.png"]);
    expect(book.preview_url).toBe("/uploads/a.png");
  });

  it("returns null when book is not found", async () => {
    const error = { response: { status: 404 } };
    api.get.mockRejectedValueOnce(error);
    const book = await fetchBook(999);
    expect(api.get).toHaveBeenCalledWith("books/999");
    expect(book).toBeNull();
  });

  it("updates a book", async () => {
    const apiData = { id: 1 };
    api.put.mockResolvedValueOnce({ data: { data: apiData } });
    const formData = new FormData();
    const book = await updateBook(1, formData);
    expect(api.put).toHaveBeenCalledWith(
      "books/1",
      formData,
      expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
    );
    expect(book).toEqual({
      id: 1,
      cover_image_url: null,
      pdf_url: null,
      preview_url: null,
      preview_pages: [],
    });
  });

  it("creates a book", async () => {
    const apiData = { id: 2 };
    api.post.mockResolvedValueOnce({ data: { data: apiData } });
    const formData = new FormData();
    const book = await createBook(formData);
    expect(api.post).toHaveBeenCalledWith(
      "books",
      formData,
      expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
    );
    expect(book).toEqual({
      id: 2,
      cover_image_url: null,
      pdf_url: null,
      preview_url: null,
      preview_pages: [],
    });
  });

  it("buildUrl preserves API base paths", () => {
    const originalBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    jest.isolateModules(() => {
      process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.com/api/v1";
      const { buildUrl } = require("../../services/bookService");
      expect(buildUrl("/uploads/test.jpg")).toBe(
        "https://example.com/uploads/test.jpg"
      );
    });
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBase;
  });

  it("buildUrl prefixes relative API base paths", () => {
    const originalBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    jest.isolateModules(() => {
      process.env.NEXT_PUBLIC_API_BASE_URL = "/api";
      const { buildUrl } = require("../../services/bookService");
      expect(buildUrl("/uploads/test.jpg")).toBe("/uploads/test.jpg");
    });
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBase;
  });

  it("buildUrl returns a same-origin path when API base is empty", () => {
    const originalBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    jest.isolateModules(() => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      const { buildUrl } = require("../../services/bookService");
      expect(buildUrl("/uploads/test.jpg")).toBe("/uploads/test.jpg");
    });
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBase;
  });
});
