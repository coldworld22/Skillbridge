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
      books: [{ id: 1, title: "A", cover_image_url: null, pdf_url: null }],
      meta,
    });
  });

  it("fetches single book", async () => {
    const apiData = { id: 1, title: "A" };
    api.get.mockResolvedValueOnce({ data: { data: apiData } });
    const book = await fetchBook(1);
    expect(api.get).toHaveBeenCalledWith("/books/1");
    expect(book).toEqual({ id: 1, title: "A", cover_image_url: null, pdf_url: null });
  });

  it("fetches single book as admin", async () => {
    const apiData = { id: 1, title: "A" };
    api.get.mockResolvedValueOnce({ data: { data: apiData } });
    const book = await fetchBook(1, { admin: true });
    expect(api.get).toHaveBeenCalledWith("/books/admin/1");
    expect(book).toEqual({ id: 1, title: "A", cover_image_url: null, pdf_url: null });
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
    expect(book).toEqual({ id: 1, cover_image_url: null, pdf_url: null });
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
    expect(book).toEqual({ id: 2, cover_image_url: null, pdf_url: null });
  });
});
