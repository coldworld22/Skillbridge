const {
  normalizePlanId,
  parseIncludedPlanRefs,
  buildPlanIdLookup,
  collectCoverageByPlan,
} = require("../planCoverage.helper");

describe("plan coverage helper", () => {
  test("normalizePlanId coerces values to trimmed strings", () => {
    expect(normalizePlanId(" 123 ")).toBe("123");
    expect(normalizePlanId(42)).toBe("42");
    expect(normalizePlanId(null)).toBeNull();
    expect(normalizePlanId(" ")).toBeNull();
  });

  test("parseIncludedPlanRefs handles arrays, JSON strings and objects", () => {
    expect(parseIncludedPlanRefs(["plan-1", "plan-2"]).sort()).toEqual(["plan-1", "plan-2"].sort());
    expect(parseIncludedPlanRefs("[\"a\", \"b\"]")).toEqual(["a", "b"]);
    expect(parseIncludedPlanRefs({ value: "c" })).toEqual(["c"]);
    expect(parseIncludedPlanRefs("value-only")).toEqual(["value-only"]);
    expect(parseIncludedPlanRefs(undefined)).toEqual([]);
  });

  test("buildPlanIdLookup maps ids and slugs", () => {
    const lookup = buildPlanIdLookup([
      { id: "plan-id", slug: "starter" },
      { id: "second" },
    ]);
    expect(lookup.get("plan-id")).toBe("plan-id");
    expect(lookup.get("starter")).toBe("plan-id");
    expect(lookup.get("second")).toBe("second");
  });

  test("collectCoverageByPlan groups entries by resolved plan id", () => {
    const plans = [
      { id: "p1", slug: "starter" },
      { id: "p2", slug: "growth" },
    ];
    const lookup = buildPlanIdLookup(plans);
    const rows = [
      { id: 1, included_plans: ["p1"] },
      { id: 2, included_plans: "[\"growth\"]" },
      { id: 4, included_plans: "STARTER" },
      { id: 3, included_plans: null },
    ];

    const grouped = collectCoverageByPlan(rows, lookup, (row) => ({ id: row.id }));
    expect(grouped.p1).toEqual([{ id: 1 }, { id: 4 }]);
    expect(grouped.p2).toEqual([{ id: 2 }]);
    expect(grouped.p3).toBeUndefined();
  });
});
