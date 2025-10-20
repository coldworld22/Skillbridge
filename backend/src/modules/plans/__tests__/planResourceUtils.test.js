const { parseIncludedPlanIds, groupResourcesByPlan } = require("../planResourceUtils");

describe("plan resource utils", () => {
  describe("parseIncludedPlanIds", () => {
    test("returns empty array for nullish input", () => {
      expect(parseIncludedPlanIds(null)).toEqual([]);
      expect(parseIncludedPlanIds(undefined)).toEqual([]);
    });

    test("parses JSON strings and arrays", () => {
      expect(parseIncludedPlanIds("[\"a\", \"b\"]")).toEqual(["a", "b"]);
      expect(parseIncludedPlanIds(["c", "d", "c"]).sort()).toEqual(["c", "d"]);
    });

    test("handles object entries with plan identifiers", () => {
      const input = [
        { plan_id: "plan-1" },
        { planId: "plan-2" },
        { id: "plan-3" },
        { value: "plan-4" },
      ];
      expect(parseIncludedPlanIds(input)).toEqual(["plan-1", "plan-2", "plan-3", "plan-4"]);
    });

    test("falls back to raw trimmed strings when parsing fails", () => {
      expect(parseIncludedPlanIds("   plan-5   ")).toEqual(["plan-5"]);
      expect(parseIncludedPlanIds("not-json")).toEqual(["not-json"]);
    });
  });

  describe("groupResourcesByPlan", () => {
    test("groups mapped items under each plan id", () => {
      const resources = [
        { id: 1, title: "Book A", included_plans: ["plan-1", "plan-2"] },
        { id: 2, title: "Book B", included_plans: "[\"plan-2\"]" },
        { id: 3, title: "Book C", included_plans: [] },
      ];
      const grouped = groupResourcesByPlan(resources, (item) => ({
        id: item.id,
        title: item.title,
      }));

      expect(grouped).toEqual({
        "plan-1": [{ id: 1, title: "Book A" }],
        "plan-2": [
          { id: 1, title: "Book A" },
          { id: 2, title: "Book B" },
        ],
      });
    });

    test("skips entries without a mapped value", () => {
      const grouped = groupResourcesByPlan(
        [{ id: 1, included_plans: ["plan-1"] }],
        () => null
      );
      expect(grouped).toEqual({});
    });
  });
});
