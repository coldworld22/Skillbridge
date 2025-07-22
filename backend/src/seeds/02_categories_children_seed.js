const { v4: uuidv4 } = require("uuid");

exports.seed = async function (knex) {
  const now = new Date();

  // Get parent IDs by slug
  const parents = await knex("categories")
    .whereNull("parent_id")
    .select("id", "slug");

  const getParentId = (slug) => parents.find((p) => p.slug === slug)?.id;

  const subcategories = [
    // Development
    { name: "Web Development", slug: "web-development", parent: "development", image: "web.jpg" },
    { name: "Mobile Development", slug: "mobile-development", parent: "development", image: "mobile.jpg" },
    { name: "Game Development", slug: "game-development", parent: "development", image: "game.jpg" },

    // Design
    { name: "UI/UX Design", slug: "ui-ux", parent: "design", image: "uiux.jpg" },
    { name: "Graphic Design", slug: "graphic-design", parent: "design", image: "graphic.jpg" },

    // Health
    { name: "Nursing", slug: "nursing", parent: "health-medicine", image: "nursing.jpg" },
    { name: "Pharmacology", slug: "pharmacology", parent: "health-medicine", image: "pharma.jpg" },

    // Business
    { name: "Entrepreneurship", slug: "entrepreneurship", parent: "business", image: "entrepreneur.jpg" },
    { name: "Finance", slug: "finance", parent: "business", image: "finance.jpg" },

    // Add more as needed
  ];

  const rows = subcategories.map((s) => ({
    id: uuidv4(),
    name: s.name,
    slug: s.slug,
    status: "active",
    parent_id: getParentId(s.parent),
    image_url: `/uploads/categories/${s.image}`,
    created_at: now,
    updated_at: now,
  }));

  await knex("categories").insert(rows);
};
