import api from "@/services/api/api";
import { ensureCsrfToken } from "@/services/api/csrf";
import { createInstructorClass } from "@/services/instructor/classService";

jest.mock("@/services/api/api", () => ({
  post: jest.fn(),
}));

jest.mock("@/services/api/csrf", () => ({
  ensureCsrfToken: jest.fn(),
}));

describe("createInstructorClass", () => {
  const payload = { title: "New Class" };
  const onUploadProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_BASE_URL = "";
  });

  it("posts the payload with CSRF headers and returns the formatted class", async () => {
    ensureCsrfToken.mockResolvedValue("csrf-token");

    const apiResponse = {
      data: {
        data: {
          id: 42,
          status: "Published",
          title: "My Class",
          trending: 1,
          start_date: "2024-01-01",
          end_date: "2024-01-02",
        },
      },
    };

    api.post.mockResolvedValue(apiResponse);

    const result = await createInstructorClass(payload, onUploadProgress);

    expect(ensureCsrfToken).toHaveBeenCalledTimes(1);

    expect(api.post).toHaveBeenCalledWith(
      "users/classes/instructor",
      payload,
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "multipart/form-data",
          "x-csrf-token": "csrf-token",
        }),
        onUploadProgress,
      }),
    );

    expect(result).toMatchObject({
      id: 42,
      publishStatus: "Published",
      trending: true,
      start_date: "2024-01-01",
      end_date: "2024-01-02",
    });
  });
});
