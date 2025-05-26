exports.up = function(knex) {
  return knex.schema.alterTable("admin_profiles", (table) => {
    table.date("date_of_birth").nullable();
    table.string("gender").nullable(); // optional if also missing
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("admin_profiles", (table) => {
    table.dropColumn("date_of_birth");
    table.dropColumn("gender");
  });
};
