import { formatTutorial } from "../../services/tutorialService";
import { extractData } from "../../services/api/helpers";

describe("formatTutorial", () => {
  it("parses numeric price strings", () => {
    const formatted = formatTutorial({ price: "19.99" });
    expect(formatted.price).toBe(19.99);
  });

  it("parses numeric price numbers", () => {
    const formatted = formatTutorial({ price: 19.99 });
    expect(formatted.price).toBe(19.99);
  });

  it("returns null when price is absent", () => {
    expect(formatTutorial({ price: null }).price).toBeNull();
    expect(formatTutorial({}).price).toBeNull();
  });

  describe("URL joining", () => {
    const base = "https://api.example.com";

    beforeEach(() => {
      process.env.NEXT_PUBLIC_API_BASE_URL = base;
    });

    afterEach(() => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    });

    it("handles asset paths with leading slashes", () => {
      const formatted = formatTutorial({
        thumbnail_url: "/img.png",
        preview_video: "/preview.mp4",
        instructor_avatar: "/avatar.png",
      });

      expect(formatted.thumbnail).toBe(`${base}/img.png`);
      expect(formatted.preview).toBe(`${base}/preview.mp4`);
      expect(formatted.instructorAvatar).toBe(`${base}/avatar.png`);
    });

    it("handles asset paths without leading slashes", () => {
      const formatted = formatTutorial({
        thumbnail_url: "img.png",
        preview_video: "preview.mp4",
        instructor_avatar: "avatar.png",
      });

      expect(formatted.thumbnail).toBe(`${base}/img.png`);
      expect(formatted.preview).toBe(`${base}/preview.mp4`);
      expect(formatted.instructorAvatar).toBe(`${base}/avatar.png`);
    });
  });
});

describe("extractData", () => {
  it("prefers nested data", () => {
    expect(extractData({ data: { data: [1, 2] } })).toEqual([1, 2]);
  });

  it("falls back to top-level data", () => {
    expect(extractData({ data: [3] })).toEqual([3]);
  });

  it("defaults to empty array", () => {
    expect(extractData({})).toEqual([]);
  });
});
