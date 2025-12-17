exports.up = function (knex) {
  return knex.schema.alterTable("categories", (table) => {
    table.string("icon");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("categories", (table) => {
    table.dropColumn("icon");
  });
};

