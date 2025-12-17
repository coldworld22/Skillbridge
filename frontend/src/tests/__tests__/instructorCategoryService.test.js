import api from "../../services/api/api";
import { fetchAllCategories } from "../../services/instructor/categoryService";

jest.mock("../../services/api/api", () => ({
  get: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("instructor categoryService", () => {
  it("fetches all categories", async () => {
    const apiData = [{ id: 1 }];
    api.get.mockResolvedValueOnce({ data: { data: apiData } });
    const res = await fetchAllCategories();
    expect(api.get).toHaveBeenCalledWith("/users/categories", { params: {} });
    expect(res).toEqual(apiData);
  });
});

