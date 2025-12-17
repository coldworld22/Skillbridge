import api from "../../services/api/api";
import {
  createTutorial,
  updateTutorial,
} from "../../services/instructor/tutorialService";

jest.mock("../../services/api/api", () => ({
  post: jest.fn(),
  put: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("instructor tutorialService", () => {
  it("creates a tutorial", async () => {
    const apiData = { id: 1 };
    api.post.mockResolvedValueOnce({ data: { data: apiData } });
    const formData = new FormData();
    const res = await createTutorial(formData);
    expect(api.post).toHaveBeenCalledWith(
      "/users/tutorials/admin",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    expect(res).toEqual(apiData);
  });

  it("updates a tutorial", async () => {
    const apiData = { id: 1 };
    api.put.mockResolvedValueOnce({ data: { data: apiData } });
    const formData = new FormData();
    const res = await updateTutorial(1, formData);
    expect(api.put).toHaveBeenCalledWith(
      "/users/tutorials/admin/1",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    expect(res).toEqual(apiData);
  });
});

