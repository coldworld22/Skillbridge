exports.up = function (knex) {
  return knex.schema.createTable("instructor_reviews", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("uuid_generate_v4()"));
    table
      .uuid("instructor_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .uuid("student_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.integer("rating").notNullable();
    table.text("comment");
    table
      .timestamp("created_at")
      .defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.fn.now());
    table.unique(["instructor_id", "student_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("instructor_reviews");
};
