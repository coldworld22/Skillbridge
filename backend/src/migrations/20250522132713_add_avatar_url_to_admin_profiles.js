exports.up = function(knex) {
  return knex.schema.alterTable("admin_profiles", (table) => {
    table.string("avatar_url");
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("admin_profiles", (table) => {
    table.dropColumn("avatar_url");
  });
};
