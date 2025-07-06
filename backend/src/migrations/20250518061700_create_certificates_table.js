
exports.up = function (knex) {
  return knex.schema.createTable("certificates", (table) => {

    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));
    table.string("title").notNullable();
    table.string("recipient_name").notNullable();
    table.string("course_name").notNullable();
    table.date("issue_date").notNullable();
    table.string("certificate_url").notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("certificates");
};
