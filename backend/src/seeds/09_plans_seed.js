const {
  serializeFeatureValue,
  getFeaturePresentation,
} = require("../modules/plans/planFeatureMetadata");

exports.seed = async function (knex) {
  await knex("plan_features").del();
  await knex("plans").del();

  const now = knex.fn.now();

  const planIds = {
    basic: "00000000-0000-0000-0000-0000000000b1",
    regular: "00000000-0000-0000-0000-0000000000b2",
    prime: "00000000-0000-0000-0000-0000000000b3",
    instructorBasic: "00000000-0000-0000-0000-0000000000c1",
    instructorPro: "00000000-0000-0000-0000-0000000000c2",
  };

  const planDefinitions = [
    {
      id: planIds.basic,
      name: "Basic",
      slug: "basic",
      price_monthly: 0,
      price_yearly: 0,
      currency: "USD",
      recommended: false,
      active: true,
      color: "#1F2937",
      style: JSON.stringify({
        gradientStart: "#1F2937",
        gradientEnd: "#374151",
        buttonColor: "#2563EB",
        buttonTextColor: "#FFFFFF",
      }),
      target_role: "student",
      features: {
        commission_rate: 0.3,
        groups_create: false,
        groups_join_limit: 1,
        classes_create: false,
        books_download: false,
        community_post: false,
      },
    },
    {
      id: planIds.regular,
      name: "Regular",
      slug: "regular",
      price_monthly: 9.99,
      price_yearly: 99.99,
      currency: "USD",
      recommended: true,
      active: true,
      color: "#4F46E5",
      style: JSON.stringify({
        gradientStart: "#4338CA",
        gradientEnd: "#3B82F6",
        buttonColor: "#3B82F6",
        buttonTextColor: "#FFFFFF",
      }),
      target_role: "student",
      features: {
        commission_rate: 0.2,
        groups_create: true,
        groups_join_limit: 5,
        classes_create: false,
        books_download: true,
        community_post: true,
      },
    },
    {
      id: planIds.prime,
      name: "Prime",
      slug: "prime",
      price_monthly: 19.99,
      price_yearly: 199.99,
      currency: "USD",
      recommended: false,
      active: true,
      color: "#10B981",
      style: JSON.stringify({
        gradientStart: "#059669",
        gradientEnd: "#10B981",
        buttonColor: "#34D399",
        buttonTextColor: "#FFFFFF",
      }),
      target_role: "student",
      features: {
        commission_rate: 0.1,
        groups_create: true,
        groups_join_limit: "unlimited",
        classes_create: false,
        books_download: true,
        community_post: true,
      },
    },
    {
      id: planIds.instructorBasic,
      name: "Instructor Basic",
      slug: "instructor-basic",
      price_monthly: 0,
      price_yearly: 0,
      currency: "USD",
      recommended: false,
      active: true,
      color: "#1F2937",
      style: JSON.stringify({
        gradientStart: "#1F2937",
        gradientEnd: "#374151",
        buttonColor: "#2563EB",
        buttonTextColor: "#FFFFFF",
      }),
      target_role: "instructor",
      max_courses: 5,
      ad_credits: 10,
      features: {
        commission_rate: 0.2,
        ads_max_ads: 2,
        ads_max_duration: 7,
        ads_allow_branding: false,
        ads_show_analytics: false,
        groups_create: true,
        groups_join_limit: 3,
        classes_create: true,
        tutorials_create: true,
        tutorials_max_count: 10,
        books_download: true,
        community_post: true,
      },
    },
    {
      id: planIds.instructorPro,
      name: "Instructor Pro",
      slug: "instructor-pro",
      price_monthly: 29.99,
      price_yearly: 299.99,
      currency: "USD",
      recommended: true,
      active: true,
      color: "#F59E0B",
      style: JSON.stringify({
        gradientStart: "#F59E0B",
        gradientEnd: "#D97706",
        textColor: "#1F2937",
        buttonColor: "#FBBF24",
        buttonTextColor: "#1F2937",
      }),
      target_role: "instructor",
      max_courses: 50,
      ad_credits: 100,
      features: {
        commission_rate: 0.1,
        ads_max_ads: 10,
        ads_max_duration: 30,
        ads_allow_branding: true,
        ads_show_analytics: true,
        groups_create: true,
        groups_join_limit: "unlimited",
        classes_create: true,
        tutorials_create: true,
        tutorials_max_count: null,
        books_download: true,
        community_post: true,
      },
    },
  ];

  await knex("plans").insert(
    planDefinitions.map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      currency: plan.currency,
      recommended: plan.recommended,
      active: plan.active,
      color: plan.color,
      style: plan.style,
      target_role: plan.target_role,
      max_courses: plan.max_courses ?? null,
      ad_credits: plan.ad_credits ?? 0,
      created_at: now,
      updated_at: now,
    }))
  );

  const featureRows = [];
  planDefinitions.forEach((plan) => {
    Object.entries(plan.features || {}).forEach(([key, rawValue]) => {
      const presentation = getFeaturePresentation(key, rawValue);
      const description = presentation.description || presentation.displayValue || null;
      featureRows.push({
        id: knex.raw("uuid_generate_v4()"),
        plan_id: plan.id,
        feature_key: key,
        value: serializeFeatureValue(rawValue),
        description,
        created_at: now,
        updated_at: now,
      });
    });
  });

  if (featureRows.length) {
    await knex("plan_features").insert(featureRows);
  }
};
