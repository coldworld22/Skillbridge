const TABLE_NAME = "chat_moderation";

exports.up = async function up(knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table
      .string("context_type")
      .notNullable()
      .defaultTo("direct_message");
    table.string("context_id");
    table.integer("message_id").unsigned();
    table
      .string("severity")
      .notNullable()
      .defaultTo("medium");
    table
      .string("status")
      .notNullable()
      .defaultTo("flagged");
    table.text("notes");
    table
      .jsonb("metadata")
      .notNullable()
      .defaultTo(knex.raw("'{}'::jsonb"));
    table
      .boolean("auto_action_taken")
      .notNullable()
      .defaultTo(false);
    table
      .timestamp("updated_at")
      .defaultTo(knex.fn.now());

    table.index(["context_type", "status"], "chat_moderation_context_status_idx");
    table.index(["message_id"], "chat_moderation_message_idx");
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropIndex(["context_type", "status"], "chat_moderation_context_status_idx");
    table.dropIndex(["message_id"], "chat_moderation_message_idx");

    table.dropColumn("auto_action_taken");
    table.dropColumn("metadata");
    table.dropColumn("notes");
    table.dropColumn("status");
    table.dropColumn("severity");
    table.dropColumn("message_id");
    table.dropColumn("context_id");
    table.dropColumn("context_type");
    table.dropColumn("updated_at");
  });
};
