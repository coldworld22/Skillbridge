const {
  FEATURE_METADATA,
  MODULE_ORDER,
  SYNTHETIC_PLAN_FEATURES,
  parseFeatureValue,
  serializeFeatureValue,
  getFeaturePresentation,
  buildPlanFeatureBundle,
} = require("../planFeatureMetadata");

describe("plan feature metadata", () => {
  test("parseFeatureValue handles primitives and special strings", () => {
    expect(parseFeatureValue("true")).toBe(true);
    expect(parseFeatureValue("false")).toBe(false);
    expect(parseFeatureValue("0.25")).toBeCloseTo(0.25);
    expect(parseFeatureValue("unlimited")).toBe("unlimited");
    expect(parseFeatureValue("null")).toBeNull();
    expect(parseFeatureValue(null)).toBeNull();
    expect(parseFeatureValue(5)).toBe(5);
  });

  test("serializeFeatureValue preserves strings and encodes primitives", () => {
    expect(serializeFeatureValue(true)).toBe("true");
    expect(serializeFeatureValue(false)).toBe("false");
    expect(serializeFeatureValue(3)).toBe("3");
    expect(serializeFeatureValue("unlimited")).toBe("unlimited");
    expect(serializeFeatureValue(null)).toBe("null");
    expect(serializeFeatureValue()).toBeNull();
  });

  test("getFeaturePresentation formats boolean features", () => {
    const meta = FEATURE_METADATA.groups_create;
    expect(meta).toBeDefined();
    const enabled = getFeaturePresentation("groups_create", true);
    const disabled = getFeaturePresentation("groups_create", false);
    expect(enabled.displayValue).toMatch(/create and manage groups/i);
    expect(disabled.displayValue).toMatch(/member only/i);
    expect(enabled.module).toBe("community");
  });

  test("getFeaturePresentation formats percent and count features", () => {
    const commission = getFeaturePresentation("commission_rate", 0.2);
    expect(commission.displayValue).toMatch(/20%/);
    expect(commission.description).toMatch(/retains 20%/i);

    const joinLimit = getFeaturePresentation("groups_join_limit", "unlimited");
    expect(joinLimit.displayValue).toMatch(/unlimited/);

    const tutorials = getFeaturePresentation("tutorials_max_count", 5);
    expect(tutorials.displayValue).toMatch(/5/);
  });

  test("synthetic plan features derive messaging from plan columns", () => {
    const plan = { id: "p1", target_role: "instructor", max_courses: 5, ad_credits: 25 };
    const builders = SYNTHETIC_PLAN_FEATURES.filter((f) => f.roles.includes("instructor"));
    const mapped = builders.map((def) => def.build(plan));
    const courseFeature = mapped.find((entry) => entry && /classes/i.test(entry.value));
    const adFeature = mapped.find((entry) => entry && /ad credit/i.test(entry.value));
    expect(courseFeature.value).toMatch(/5/i);
    expect(adFeature.value).toMatch(/25/i);
  });

  test("module order provides deterministic grouping", () => {
    expect(Array.isArray(MODULE_ORDER)).toBe(true);
    expect(MODULE_ORDER).toContain("ads");
  });

  test("buildPlanFeatureBundle groups features with parsed values", () => {
    const plan = {
      id: "plan-1",
      target_role: "instructor",
      max_courses: 3,
      ad_credits: 12,
      features: [
        { id: "feat-1", feature_key: "groups_create", value: "true" },
        { id: "feat-2", feature_key: "commission_rate", value: "0.2" },
      ],
    };
    const bundle = buildPlanFeatureBundle(plan);
    expect(bundle).toBeDefined();
    expect(Array.isArray(bundle.sections)).toBe(true);
    expect(bundle.sections.length).toBeGreaterThan(0);
    expect(bundle.featureMap.groups_create.value).toBe(true);
    expect(bundle.featureMap.commission_rate.value).toBeCloseTo(0.2);
    expect(bundle.featureMap.ad_credits.value).toBe(12);
    const classesSection = bundle.sections.find((section) => section.module === "classes");
    expect(classesSection).toBeDefined();
    const hasMaxCourses = classesSection.features.some(
      (feature) => feature.feature_key === "max_courses"
    );
    expect(hasMaxCourses).toBe(true);
  });
});
