exports.up = function (knex) {
  return knex.schema.table("categories", function (table) {
    table.enum("status", ["active", "inactive"]).defaultTo("active").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("categories", function (table) {
    table.dropColumn("status");
  });
};
