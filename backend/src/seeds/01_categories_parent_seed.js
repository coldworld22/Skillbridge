const { v4: uuidv4 } = require("uuid");

exports.seed = async function (knex) {
  await knex("categories").del();

  const now = new Date();

  const parents = [
    { name: "Technology & Programming", slug: "technology-programming", icon: "Code2" },
    { name: "Design & Creative Arts", slug: "design-creative-arts", icon: "Palette" },
    { name: "Business & Finance", slug: "business-finance", icon: "Briefcase" },
    { name: "Health & Wellness", slug: "health-wellness", icon: "HeartPulse" },
    { name: "Data & Analytics", slug: "data-analytics", icon: "BarChart3" },
    { name: "Marketing & Sales", slug: "marketing-sales", icon: "Megaphone" },
    { name: "Science & Engineering", slug: "science-engineering", icon: "FlaskConical" },
    { name: "Languages & Communication", slug: "languages-communication", icon: "Languages" },
    { name: "Personal Development", slug: "personal-development", icon: "Sparkles" },
    { name: "Education & Teaching", slug: "education-teaching", icon: "GraduationCap" },
  ];

  const parentRecords = parents.map((p) => ({
    id: uuidv4(),
    name: p.name,
    slug: p.slug,
    status: "active",
    parent_id: null,
    image_url: null,
    icon: p.icon,
    created_at: now,
    updated_at: now,
  }));

  await knex("categories").insert(parentRecords);
};
