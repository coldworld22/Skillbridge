import { buildTutorialFormData } from "@/utils/tutorialForm";

describe("buildTutorialFormData", () => {
  it("builds form data with provided status", () => {
    const tutorialData = {
      title: "Test Tutorial",
      shortDescription: "Short desc",
      category: "cat1",
      level: "beginner",
      language: "en",
      isFree: false,
      price: 100,
      tags: ["a", "b"],
      chapters: [
        { title: "Ch1", duration: 10, videoUrl: "vid1", preview: true },
        { title: "Ch2", duration: 20, videoUrl: "vid2", preview: false },
      ],
      thumbnail: new File([""], "thumb.jpg", { type: "image/jpeg" }),
      preview: new File([""], "prev.mp4", { type: "video/mp4" }),
    };

    const formData = buildTutorialFormData(tutorialData, "draft");

    expect(formData.get("title")).toBe("Test Tutorial");
    expect(formData.get("description")).toBe("Short desc");
    expect(formData.get("category_id")).toBe("cat1");
    expect(formData.get("level")).toBe("beginner");
    expect(formData.get("language")).toBe("en");
    expect(formData.get("status")).toBe("draft");
    expect(formData.get("is_paid")).toBe("true");
    expect(formData.get("price")).toBe("100");
    expect(JSON.parse(formData.get("tags"))).toEqual(["a", "b"]);
    expect(JSON.parse(formData.get("chapters"))).toEqual([
      {
        title: "Ch1",
        duration: 10,
        video_url: "vid1",
        order: 1,
        is_preview: true,
      },
      {
        title: "Ch2",
        duration: 20,
        video_url: "vid2",
        order: 2,
        is_preview: false,
      },
    ]);
    expect(formData.get("thumbnail")).toBe(tutorialData.thumbnail);
    expect(formData.get("preview")).toBe(tutorialData.preview);
  });

  it("uses tutorial status when no override and skips optional fields", () => {
    const tutorialData = {
      title: "Test",
      shortDescription: "Desc",
      category: "cat1",
      level: "beginner",
      language: "en",
      isFree: true,
      tags: [],
      chapters: [],
      status: "draft",
      thumbnail: "existing-thumb.jpg",
      preview: null,
    };

    const formData = buildTutorialFormData(tutorialData);

    expect(formData.get("status")).toBe("draft");
    expect(formData.get("is_paid")).toBe("false");
    expect(formData.has("price")).toBe(false);
    expect(formData.has("tags")).toBe(false);
    expect(formData.has("chapters")).toBe(false);
    expect(formData.has("thumbnail")).toBe(false);
    expect(formData.has("preview")).toBe(false);
  });
});
