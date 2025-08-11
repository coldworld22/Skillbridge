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
