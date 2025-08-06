import api from "../../services/api/api";
import { fetchBooks, fetchBook } from "../../services/bookService";

jest.mock("../../services/api/api", () => ({ get: jest.fn() }));

describe("bookService", () => {
  it("fetches books", async () => {
    const mock = [{ id: 1, title: "A" }];
    const meta = { total: 1 };
    api.get.mockResolvedValueOnce({ data: { data: mock, meta } });
    const res = await fetchBooks({
      page: 2,
      perPage: 5,
      filters: { search: "test" },
      sort: { sortBy: "title" },
    });
    expect(api.get).toHaveBeenCalledWith("/books", {
      params: { page: 2, perPage: 5, search: "test", sortBy: "title" },
    });
    expect(res).toEqual({ books: mock, meta });
  });

  it("fetches single book", async () => {
    const mock = { id: 1, title: "A" };
    api.get.mockResolvedValueOnce({ data: { data: mock } });
    const book = await fetchBook(1);
    expect(api.get).toHaveBeenCalledWith("/books/1");
    expect(book).toEqual(mock);
  });
});
