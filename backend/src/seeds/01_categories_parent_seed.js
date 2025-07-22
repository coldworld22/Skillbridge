const { v4: uuidv4 } = require("uuid");

exports.seed = async function (knex) {
  await knex("categories").del();

  const now = new Date();

  const parents = [
    { name: "Development", slug: "development", image: "dev.jpg" },
    { name: "Design", slug: "design", image: "design.jpg" },
    { name: "Health & Medicine", slug: "health-medicine", image: "medicine.jpg" },
    { name: "Business", slug: "business", image: "business.jpg" },
    { name: "Science", slug: "science", image: "science.jpg" },
    { name: "IT & Software", slug: "it-software", image: "it.jpg" },
    { name: "Marketing", slug: "marketing", image: "marketing.jpg" },
    { name: "Humanities", slug: "humanities", image: "humanities.jpg" },
    { name: "Languages", slug: "languages", image: "language.jpg" },
  ];

  const parentRecords = parents.map((p) => ({
    id: uuidv4(),
    name: p.name,
    slug: p.slug,
    status: "active",
    parent_id: null,
    image_url: `/uploads/categories/${p.image}`,
    created_at: now,
    updated_at: now,
  }));

  await knex("categories").insert(parentRecords);
};
