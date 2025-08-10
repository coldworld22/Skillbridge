import { formatTutorial } from "../../services/tutorialService";

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
});
