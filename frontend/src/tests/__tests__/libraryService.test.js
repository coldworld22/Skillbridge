import api from "../../services/api/api";
import { fetchLibrary } from "../../services/libraryService";

jest.mock("../../services/api/api", () => ({ get: jest.fn() }));

describe("libraryService", () => {
  it("fetches purchased books", async () => {
    const mock = [{ id: 1, title: "B" }];
    api.get.mockResolvedValue({ data: { data: mock } });
    const items = await fetchLibrary();
    expect(api.get).toHaveBeenCalledWith("library");
    expect(items).toEqual(mock);
  });
});
