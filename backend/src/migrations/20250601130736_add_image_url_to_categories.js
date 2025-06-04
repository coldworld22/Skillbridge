exports.up = function (knex) {
  return knex.schema.table("categories", function (table) {
    table.string("image_url").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("categories", function (table) {
    table.dropColumn("image_url");
  });
};
