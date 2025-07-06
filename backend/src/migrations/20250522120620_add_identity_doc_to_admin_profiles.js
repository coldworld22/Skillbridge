exports.up = function (knex) {
  return knex.schema.alterTable("admin_profiles", (table) => {
    table.string("identity_doc_url");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("admin_profiles", (table) => {
    table.dropColumn("identity_doc_url");
  });
};
