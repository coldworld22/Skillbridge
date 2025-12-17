exports.up = async function (knex) {
  await knex.schema.alterTable("class_assignments", (table) => {
    table
      .string("type")
      .notNullable()
      .defaultTo("text");
    table
      .boolean("allow_late")
      .notNullable()
      .defaultTo(false);
    table.string("time_to_finish");
    table.string("language");
    table.text("starter_code");
    table.text("grading_rubric");
    table
      .jsonb("questions")
      .notNullable()
      .defaultTo(knex.raw("'[]'::jsonb"));
    table.jsonb("settings");
    table.jsonb("supporting_resources");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("class_assignments", (table) => {
    table.dropColumn("supporting_resources");
    table.dropColumn("settings");
    table.dropColumn("questions");
    table.dropColumn("grading_rubric");
    table.dropColumn("starter_code");
    table.dropColumn("language");
    table.dropColumn("time_to_finish");
    table.dropColumn("allow_late");
    table.dropColumn("type");
  });
};
