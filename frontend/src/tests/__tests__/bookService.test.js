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
      filters: { search: "test" },
      sort: { sortBy: "title" },
    });
    expect(api.get).toHaveBeenCalledWith("/books", {
      params: { page: 2, perPage: 5, search: "test", sortBy: "title" },
    });
    expect(res).toEqual({
      books: [
        {
          id: 1,
          title: "A",
          cover_image_url: null,
          pdf_url: null,
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
    expect(api.get).toHaveBeenCalledWith("/books/1");
    expect(book).toEqual({
      id: 1,
      title: "A",
      cover_image_url: null,
      pdf_url: null,
      preview_pages: [],
    });
  });

  it("fetches single book as admin", async () => {
    const apiData = { id: 1, title: "A" };
    api.get.mockResolvedValueOnce({ data: { data: apiData } });
    const book = await fetchBook(1, { admin: true });
    expect(api.get).toHaveBeenCalledWith("/books/admin/1");
    expect(book).toEqual({
      id: 1,
      title: "A",
      cover_image_url: null,
      pdf_url: null,
      preview_pages: [],
    });
  });

  it("updates a book", async () => {
    const apiData = { id: 1 };
    api.put.mockResolvedValueOnce({ data: { data: apiData } });
    const formData = new FormData();
    const book = await updateBook(1, formData);
    expect(api.put).toHaveBeenCalledWith(
      "/books/1",
      formData,
      expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
    );
    expect(book).toEqual({
      id: 1,
      cover_image_url: null,
      pdf_url: null,
      preview_pages: [],
    });
  });

  it("creates a book", async () => {
    const apiData = { id: 2 };
    api.post.mockResolvedValueOnce({ data: { data: apiData } });
    const formData = new FormData();
    const book = await createBook(formData);
    expect(api.post).toHaveBeenCalledWith(
      "/books",
      formData,
      expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
    );
    expect(book).toEqual({
      id: 2,
      cover_image_url: null,
      pdf_url: null,
      preview_pages: [],
    });
  });

  it("buildUrl strips versioned API base paths", () => {
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

  it("buildUrl keeps relative api prefixes by default", () => {
    const originalBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    jest.isolateModules(() => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      const { buildUrl } = require("../../services/bookService");
      expect(buildUrl("/uploads/test.jpg")).toBe("/api/uploads/test.jpg");
    });
    process.env.NEXT_PUBLIC_API_BASE_URL = originalBase;
  });
});
