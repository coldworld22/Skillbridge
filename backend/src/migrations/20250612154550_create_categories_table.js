exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('categories');
  if (exists) return;
  return knex.schema.createTable("categories", function (table) {
    table.uuid("id").primary();
    table.string("name").notNullable();
    table.uuid("parent_id").nullable();
    table.string("status").notNullable().defaultTo("active");
    table.string("slug").notNullable();
    table.string("image_url");
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasTable('categories');
  if (!exists) return;
  return knex.schema.dropTable("categories");
};
