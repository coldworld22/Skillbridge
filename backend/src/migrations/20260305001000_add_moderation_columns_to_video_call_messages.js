const TABLE_NAME = "video_call_messages";

exports.up = async function up(knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table
      .boolean("is_flagged")
      .notNullable()
      .defaultTo(false);
    table.string("flag_severity");
    table
      .string("moderation_status")
      .notNullable()
      .defaultTo("visible");
    table
      .jsonb("flag_metadata")
      .notNullable()
      .defaultTo(knex.raw("'{}'::jsonb"));
    table.timestamp("flagged_at");
  });

  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.index(["room_id", "is_flagged"], "video_call_messages_flag_idx");
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropIndex(["room_id", "is_flagged"], "video_call_messages_flag_idx");
  });

  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn("flagged_at");
    table.dropColumn("flag_metadata");
    table.dropColumn("moderation_status");
    table.dropColumn("flag_severity");
    table.dropColumn("is_flagged");
  });
};
