import api from "../../services/api/api";
import { fetchBooks, fetchBook } from "../../services/bookService";

jest.mock("../../services/api/api", () => ({ get: jest.fn() }));

describe("bookService", () => {
  it("fetches books", async () => {
    const mock = [{ id: 1, title: "A" }];
    api.get.mockResolvedValueOnce({ data: { data: mock } });
    const books = await fetchBooks();
    expect(api.get).toHaveBeenCalledWith("/books", { params: {} });
    expect(books).toEqual(mock);
  });

  it("fetches single book", async () => {
    const mock = { id: 1, title: "A" };
    api.get.mockResolvedValueOnce({ data: { data: mock } });
    const book = await fetchBook(1);
    expect(api.get).toHaveBeenCalledWith("/books/1");
    expect(book).toEqual(mock);
  });
});
