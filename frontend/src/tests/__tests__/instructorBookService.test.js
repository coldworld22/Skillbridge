import api from "../../services/api/api";
import {
  fetchInstructorBooks,
  createBook,
  updateBook,
  deleteBook,
  fetchAnalytics,
} from "../../services/instructor/bookService";

jest.mock("../../services/api/api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("instructor bookService", () => {
  it("fetches instructor books", async () => {
    const apiData = [{ id: 1 }];
    const meta = { page: 1 };
    api.get.mockResolvedValueOnce({ data: { data: apiData, meta } });
    const res = await fetchInstructorBooks();
    expect(api.get).toHaveBeenCalledWith("/instructor/books");
    expect(res).toEqual({ books: apiData, meta: {} });
  });

  it("creates a book", async () => {
    const apiData = { id: 1 };
    api.post.mockResolvedValueOnce({ data: { data: apiData } });
    const formData = new FormData();
    const cb = jest.fn();
    const res = await createBook(formData, cb);
    expect(api.post).toHaveBeenCalledWith(
      "/books",
      formData,
      expect.objectContaining({
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: cb,
      })
    );
    expect(res).toEqual(apiData);
  });

  it("updates a book", async () => {
    const apiData = { id: 1 };
    api.put.mockResolvedValueOnce({ data: { data: apiData } });
    const formData = new FormData();
    const cb = jest.fn();
    const res = await updateBook(1, formData, cb);
    expect(api.put).toHaveBeenCalledWith(
      "/books/1",
      formData,
      expect.objectContaining({
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: cb,
      })
    );
    expect(res).toEqual(apiData);
  });

  it("deletes a book", async () => {
    api.delete.mockResolvedValueOnce({});
    const res = await deleteBook(1);
    expect(api.delete).toHaveBeenCalledWith("/books/1");
    expect(res).toBe(true);
  });

  it("fetches analytics", async () => {
    const apiData = { sales: 10 };
    api.get.mockResolvedValueOnce({ data: { data: apiData } });
    const params = { year: 2023 };
    const res = await fetchAnalytics(params);
    expect(api.get).toHaveBeenCalledWith("/instructor/books/analytics", { params });
    expect(res).toEqual(apiData);
  });
});

