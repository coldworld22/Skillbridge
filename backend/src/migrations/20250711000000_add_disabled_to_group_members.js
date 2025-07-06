exports.up = function (knex) {
  return knex.schema.table("group_members", function (table) {
    table.boolean("disabled").defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.table("group_members", function (table) {
    table.dropColumn("disabled");
  });
};
