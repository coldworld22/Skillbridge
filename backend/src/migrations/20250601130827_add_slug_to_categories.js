exports.up = function (knex) {
  return knex.schema.table("categories", function (table) {
    table.string("slug").unique().notNullable().defaultTo("temp-slug");
  });
};

exports.down = function (knex) {
  return knex.schema.table("categories", function (table) {
    table.dropColumn("slug");
  });
};
