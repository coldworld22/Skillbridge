import api from "../../services/api/api";
import { fetchBookCategories } from "../../services/bookCategoryService";

jest.mock("../../services/api/api", () => ({ get: jest.fn() }));

describe("bookCategoryService", () => {
  it("fetches book categories", async () => {
    const mock = [{ id: 1, name: "Fiction" }];
    api.get.mockResolvedValue({ data: { data: mock } });

    const categories = await fetchBookCategories();

    expect(api.get).toHaveBeenCalledWith("book-categories");
    expect(categories).toEqual(mock);
  });
});
