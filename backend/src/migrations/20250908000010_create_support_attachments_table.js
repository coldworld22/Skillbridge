exports.up = function (knex) {
  return knex.schema.createTable("support_attachments", function (table) {
    table.increments("id");
    table
      .uuid("message_id")
      .references("id")
      .inTable("support_messages")
      .onDelete("CASCADE");
    table.string("file_url");
    table.string("file_name");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("support_attachments");
};

