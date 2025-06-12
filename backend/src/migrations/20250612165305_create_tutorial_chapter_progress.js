exports.up = function(knex) {
  return knex.schema.createTable("tutorial_chapter_progress", function(table) {
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.uuid("chapter_id").notNullable().references("id").inTable("tutorial_chapters").onDelete("CASCADE");
    table.primary(["user_id", "chapter_id"]);
    table.timestamp("completed_at").defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("tutorial_chapter_progress");
};
