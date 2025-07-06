
exports.up = function (knex) {
  return knex.schema.createTable("certificates", (table) => {

    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));
    table.string("title").notNullable();
    table.text("description");
    table.uuid("user_id").notNullable();
    table.uuid("class_id").notNullable();
    table.timestamp("issued_at").defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("certificates");
};
