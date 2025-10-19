const {
  parseIncludedPlanIds,
  groupContentByPlan,
} = require("../planContent.helper");

describe("parseIncludedPlanIds", () => {
  test("returns empty array for nullish values", () => {
    expect(parseIncludedPlanIds(null)).toEqual([]);
    expect(parseIncludedPlanIds(undefined)).toEqual([]);
  });

  test("normalizes arrays and trims values", () => {
    expect(parseIncludedPlanIds([" plan-1 ", "", null, "plan-2"]))
      .toEqual(["plan-1", "plan-2"]);
  });

  test("parses json encoded arrays", () => {
    expect(parseIncludedPlanIds('["plan-1","plan-3"]')).toEqual([
      "plan-1",
      "plan-3",
    ]);
  });

  test("wraps single values", () => {
    expect(parseIncludedPlanIds("plan-4")).toEqual(["plan-4"]);
    expect(parseIncludedPlanIds(123)).toEqual(["123"]);
  });

  test("ignores invalid json gracefully", () => {
    expect(parseIncludedPlanIds("not-json")).toEqual(["not-json"]);
  });
});

describe("groupContentByPlan", () => {
  test("skips items without plan references", () => {
    const grouped = groupContentByPlan([{ id: 1, included_plans: [] }]);
    expect(grouped).toEqual({});
  });

  test("groups items by each plan id", () => {
    const grouped = groupContentByPlan(
      [
        { id: 1, title: "Alpha", included_plans: ["plan-a"] },
        { id: 2, title: "Beta", included_plans: '["plan-a","plan-b"]' },
      ],
      (item) => ({
        id: item.id,
        label: item.title,
      })
    );

    expect(grouped).toEqual({
      "plan-a": [
        { id: 1, label: "Alpha" },
        { id: 2, label: "Beta" },
      ],
      "plan-b": [{ id: 2, label: "Beta" }],
    });
  });

  test("sorts grouped items alphabetically by title", () => {
    const grouped = groupContentByPlan([
      { id: 1, title: "Zulu", included_plans: ["plan-a"] },
      { id: 2, title: "alpha", included_plans: ["plan-a"] },
      { id: 3, title: "Bravo", included_plans: ["plan-a"] },
    ]);

    expect(grouped["plan-a"].map((item) => item.title)).toEqual([
      "alpha",
      "Bravo",
      "Zulu",
    ]);
  });
});
