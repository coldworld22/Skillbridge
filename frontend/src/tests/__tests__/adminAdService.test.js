import api from "../../services/api/api";
import { fetchAds } from "../../services/admin/adService";

jest.mock("../../services/api/api", () => ({ get: jest.fn() }));

describe("admin adService fetchAds", () => {
  it("includes role in params when provided", async () => {
    api.get.mockResolvedValue({ data: { data: [], meta: {} } });
    await fetchAds({ role: "student" });
    expect(api.get).toHaveBeenCalledWith("/ads/admin", { params: { role: "student" } });
  });
});
