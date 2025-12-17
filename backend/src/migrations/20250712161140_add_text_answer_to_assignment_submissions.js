exports.up = async function (knex) {
  await knex.schema.alterTable("assignment_submissions", (table) => {
    table.text("text_answer");
    table
      .timestamp("updated_at")
      .defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("tutorial_assignment_submissions", (table) => {
    table.text("text_answer");
    table
      .timestamp("updated_at")
      .defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("assignment_submissions", (table) => {
    table.dropColumn("text_answer");
    table.dropColumn("updated_at");
  });

  await knex.schema.alterTable("tutorial_assignment_submissions", (table) => {
    table.dropColumn("text_answer");
    table.dropColumn("updated_at");
  });
};
