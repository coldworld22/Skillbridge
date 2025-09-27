const TABLE_NAME = "certificate_templates";

exports.up = function (knex) {
  return knex.schema.alterTable(TABLE_NAME, function (table) {
    table
      .jsonb("sample_data")
      .notNullable()
      .defaultTo(knex.raw("'{}'::jsonb"));
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable(TABLE_NAME, function (table) {
    table.dropColumn("sample_data");
  });
};
