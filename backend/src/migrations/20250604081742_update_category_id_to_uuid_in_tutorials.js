// 📁 migrations/20250604081742_update_category_id_to_uuid_in_tutorials.js

exports.up = async function (knex) {
  const hasCategoryId = await knex.schema.hasColumn("tutorials", "category_id");
  if (hasCategoryId) {
    // Drop the column directly if constraint is already gone
    await knex.schema.alterTable("tutorials", (table) => {
      table.dropColumn("category_id");
    });
  }

  // Recreate the column as UUID and add FK to categories
  await knex.schema.alterTable("tutorials", (table) => {
    table
      .uuid("category_id")
      .references("id")
      .inTable("categories")
      .onDelete("SET NULL");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("tutorials", (table) => {
    table.dropForeign("category_id");
    table.dropColumn("category_id");
    table.integer("category_id"); // Revert back to integer
  });
};
