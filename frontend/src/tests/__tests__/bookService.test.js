import api from "../../services/api/api";
import { fetchBooks, fetchBook, updateBook } from "../../services/bookService";

jest.mock("../../services/api/api", () => ({ get: jest.fn(), put: jest.fn() }));

describe("bookService", () => {
  it("fetches books", async () => {
    const mock = [{ id: 1, title: "A" }];
    api.get.mockResolvedValueOnce({ data: { data: mock } });
    const books = await fetchBooks();
    expect(api.get).toHaveBeenCalledWith("/books");
    expect(books).toEqual(mock);
  });

  it("fetches single book", async () => {
    const mock = { id: 1, title: "A" };
    api.get.mockResolvedValueOnce({ data: { data: mock } });
    const book = await fetchBook(1);
    expect(api.get).toHaveBeenCalledWith("/books/1");
    expect(book).toEqual(mock);
  });

  it("updates a book", async () => {
    const mock = { id: 1 };
    api.put.mockResolvedValueOnce({ data: { data: mock } });
    const formData = new FormData();
    const book = await updateBook(1, formData);
    expect(api.put).toHaveBeenCalledWith(
      "/books/1",
      formData,
      expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
    );
    expect(book).toEqual(mock);
  });
});
