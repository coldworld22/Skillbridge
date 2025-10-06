import api from "../../services/api/api";
import { fetchAds } from "../../services/admin/adService";

jest.mock("../../services/api/api", () => ({
  get: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("admin adService", () => {
  it("forwards query params", async () => {
    api.get.mockResolvedValueOnce({ data: { data: [], meta: {} } });
    await fetchAds({
      limit: 5,
      offset: 10,
      role: "student",
      status: "active",
      type: "promotion",
      search: "hello",
    });
    expect(api.get).toHaveBeenCalledWith("ads/admin", {
      params: {
        limit: 5,
        offset: 10,
        role: "student",
        status: "active",
        type: "promotion",
        search: "hello",
      },
    });
  });
});
