exports.up = async function (knex) {
  const hasUpdatedAt = await knex.schema.hasColumn("categories", "updated_at");

  return knex.schema.table("categories", function (table) {
    if (!hasUpdatedAt) {
      table.timestamp("updated_at").defaultTo(knex.fn.now());
    }
  });
};

exports.down = function (knex) {
  return knex.schema.table("categories", function (table) {
    table.dropColumn("updated_at");
  });
};
