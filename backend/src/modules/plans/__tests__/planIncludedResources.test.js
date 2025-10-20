const {
  parsePlanReferences,
  createPlanReferenceResolver,
  groupItemsByPlan,
} = require("../planIncludedResources");

describe("planIncludedResources", () => {
  describe("parsePlanReferences", () => {
    it("parses arrays and trims values", () => {
      expect(parsePlanReferences([" plan-1 ", "plan-2", null])).toEqual(["plan-1", "plan-2"]);
    });

    it("parses json strings and single references", () => {
      expect(parsePlanReferences('["plan-a","plan-b"]')).toEqual(["plan-a", "plan-b"]);
      expect(parsePlanReferences("plan-c")).toEqual(["plan-c"]);
    });

    it("ignores objects and falsy values", () => {
      expect(parsePlanReferences("{}")).toEqual([]);
      expect(parsePlanReferences(undefined)).toEqual([]);
      expect(parsePlanReferences(null)).toEqual([]);
    });
  });

  describe("createPlanReferenceResolver", () => {
    const plans = [
      { id: "plan-1", slug: "starter" },
      { id: "PLAN-2", slug: "PRO" },
    ];

    it("resolves ids and slugs case-insensitively", () => {
      const resolve = createPlanReferenceResolver(plans);
      expect(resolve("plan-1")).toBe("plan-1");
      expect(resolve("starter")).toBe("plan-1");
      expect(resolve("plan-2")).toBe("PLAN-2");
      expect(resolve("pro")).toBe("PLAN-2");
      expect(resolve("unknown")).toBeNull();
    });
  });

  describe("groupItemsByPlan", () => {
    const plans = [
      { id: "plan-1", slug: "starter" },
      { id: "plan-2", slug: "pro" },
    ];

    it("groups items by resolved plan ids", () => {
      const resolve = createPlanReferenceResolver(plans);
      const items = [
        { id: "a", included_plans: ["plan-1", "pro"] },
        { id: "b", included_plans: "[\"starter\"]" },
        { id: "c", included_plans: ["missing"] },
        { id: "d", included_plans: null },
      ];

      const grouped = groupItemsByPlan(
        items,
        (item) => ({ id: item.id }),
        resolve
      );

      expect(grouped["plan-1"]).toHaveLength(2);
      expect(grouped["plan-2"]).toHaveLength(1);
      expect(grouped["plan-1"].map((i) => i.id)).toEqual(["a", "b"]);
      expect(grouped["plan-2"].map((i) => i.id)).toEqual(["a"]);
      expect(grouped["missing"]).toBeUndefined();
    });

    it("deduplicates plan ids per item", () => {
      const resolve = createPlanReferenceResolver(plans);
      const grouped = groupItemsByPlan(
        [{ id: "x", included_plans: ["plan-1", "plan-1"] }],
        (item) => ({ id: item.id }),
        resolve
      );

      expect(grouped["plan-1"]).toHaveLength(1);
    });
  });
});

