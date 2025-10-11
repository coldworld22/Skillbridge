import api from "../../services/api/api";
import {
  fetchInstructorBooks,
  createBook,
  updateBook,
  deleteBook,
  fetchBook,
  fetchBookAnalytics,
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
    expect(res.meta).toBe(meta);
    expect(res.books[0]).toMatchObject({
      id: 1,
      coverUrl: "/images/default-book-cover.jpg",
      cover_image_url: "/images/default-book-cover.jpg",
      pdf_download_url: "/api/books/1/pdf",
      pdf_url: null,
      preview_pages: [],
      preview_url: null,
    });
  });

  it("omits inactive filter defaults when fetching instructor books", async () => {
    api.get.mockResolvedValueOnce({ data: { data: [], meta: {} } });
    await fetchInstructorBooks({
      filters: {
        search: "",
        status: "",
        priceRange: 0,
        language: null,
        tags: [],
      },
    });
    expect(api.get).toHaveBeenCalledWith("/instructor/books");
  });

  it("passes normalized filters to the instructor books endpoint", async () => {
    api.get.mockResolvedValueOnce({ data: { data: [], meta: {} } });
    await fetchInstructorBooks({
      page: 2,
      perPage: 5,
      filters: {
        search: "React",
        priceRange: "15",
        tags: ["frontend", ""],
      },
      sort: { sortBy: "title" },
      status: "approved",
    });
    expect(api.get).toHaveBeenCalledWith(
      "/instructor/books",
      expect.objectContaining({
        params: expect.objectContaining({
          page: 2,
          perPage: 5,
          search: "React",
          priceRange: 15,
          tags: ["frontend"],
          sortBy: "title",
          status: "approved",
        }),
      })
    );
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
    expect(res).toMatchObject({
      id: 1,
      coverUrl: "/images/default-book-cover.jpg",
      cover_image_url: "/images/default-book-cover.jpg",
      pdf_download_url: "/api/books/1/pdf",
      pdf_url: null,
      preview_pages: [],
      preview_url: null,
    });
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
    expect(res).toMatchObject({
      id: 1,
      coverUrl: "/images/default-book-cover.jpg",
      cover_image_url: "/images/default-book-cover.jpg",
      pdf_download_url: "/api/books/1/pdf",
      pdf_url: null,
      preview_pages: [],
      preview_url: null,
    });
  });

  it("deletes a book", async () => {
    api.delete.mockResolvedValueOnce({});
    const res = await deleteBook(1);
    expect(api.delete).toHaveBeenCalledWith("/books/1");
    expect(res).toBe(true);
  });

  it("fetches a book", async () => {
    const apiData = { id: 1 };
    api.get.mockResolvedValueOnce({ data: { data: apiData } });
    const res = await fetchBook(1);
    expect(api.get).toHaveBeenCalledWith("/books/1");
    expect(res).toMatchObject({
      id: 1,
      coverUrl: "/images/default-book-cover.jpg",
      cover_image_url: "/images/default-book-cover.jpg",
      pdf_download_url: "/api/books/1/pdf",
      pdf_url: null,
      preview_pages: [],
      preview_url: null,
    });
  });

  it("fetches analytics", async () => {
    const apiData = { sales: 10 };
    api.get.mockResolvedValueOnce({ data: { data: apiData } });
    const params = { year: 2023 };
    const res = await fetchBookAnalytics(params);
    expect(api.get).toHaveBeenCalledWith("/instructor/books/analytics", { params });
    expect(res).toEqual(apiData);
  });
});

