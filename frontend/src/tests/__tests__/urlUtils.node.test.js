/**
 * @jest-environment node
 */
import { joinUrl } from "../../utils/url";
import { formatTutorial } from "../../services/tutorialService";

describe("joinUrl in node environment", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.INTERNAL_API_BASE_URL;
    delete process.env.APP_DOMAIN;
  });

  it("derives origin from INTERNAL_API_BASE_URL for relative bases", () => {
    process.env.INTERNAL_API_BASE_URL = "http://backend:5002/api";

    expect(joinUrl("/api", "img.png")).toBe("http://backend:5002/api/img.png");
  });

  it("uses APP_DOMAIN when available to build absolute URLs", () => {
    process.env.APP_DOMAIN = "example.com";

    expect(joinUrl("/api", "img.png")).toBe("https://example.com/api/img.png");
  });

  it("falls back to relative joining when no origin is available", () => {
    expect(joinUrl("/api", "img.png")).toBe("/api/img.png");
  });
});

describe("formatTutorial server-side URL handling", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.INTERNAL_API_BASE_URL;
    delete process.env.APP_DOMAIN;
  });

  it("prefers INTERNAL_API_BASE_URL when public base is relative", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "/api";
    process.env.INTERNAL_API_BASE_URL = "http://backend:5002/api";

    const formatted = formatTutorial({ thumbnail_url: "img.png" });

    expect(formatted.thumbnail).toBe("http://backend:5002/api/img.png");
  });

  it("derives protocol from APP_DOMAIN when internal base is missing", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "/api";
    process.env.APP_DOMAIN = "example.com";

    const formatted = formatTutorial({ preview_video: "clip.mp4" });

    expect(formatted.preview).toBe("https://example.com/api/clip.mp4");
  });
});
