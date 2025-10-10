import api from "../../services/api/api";
import { fetchLibrary } from "../../services/libraryService";

jest.mock("../../services/api/api", () => ({ get: jest.fn() }));

describe("libraryService", () => {
  it("fetches and normalizes purchased books", async () => {
    const mock = [
      {
        id: 1,
        title: "B",
        cover_image_url: "/uploads/books/cover.jpg",
        price_paid: "0",
        preview_url: "/uploads/books/sample.pdf",
        purchased_at: "2024-01-01T00:00:00.000Z",
      },
    ];
    api.get.mockResolvedValue({ data: { data: mock } });

    const items = await fetchLibrary();

    expect(api.get).toHaveBeenCalledWith("/library");
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(
      expect.objectContaining({
        id: 1,
        title: "B",
        coverUrl: "/uploads/books/cover.jpg",
        cover_image_url: "/uploads/books/cover.jpg",
        price_paid: 0,
        isFree: true,
        preview_url: "/uploads/books/sample.pdf",
        previewUrl: "/uploads/books/sample.pdf",
        purchasedAt: "2024-01-01T00:00:00.000Z",
        downloadUrl: "/api/library/download/1",
      })
    );
  });
});
