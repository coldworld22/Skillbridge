/**
 * @param {import("knex").Knex} knex
 */
exports.up = async function up(knex) {
  const exists = await knex.schema.hasTable("student_preferences");
  if (exists) return;

  await knex.schema.createTable("student_preferences", (table) => {
    table
      .uuid("user_id")
      .primary()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("preferred_language", 10).defaultTo("en");
    table.boolean("subtitles_enabled").defaultTo(true);
    table.string("subtitle_language", 10).defaultTo("en");
    table.float("playback_speed").defaultTo(1.0);
    table.boolean("two_factor_enabled").defaultTo(false);
    table.boolean("data_sharing_opt_in").defaultTo(true);
    table.boolean("show_profile_publicly").defaultTo(true);
    table.string("ui_theme", 20).defaultTo("system");
    table.boolean("ui_reduce_motion").defaultTo(false);
    table.boolean("ui_high_contrast").defaultTo(false);
    table.string("ui_density", 20).defaultTo("comfortable");
    table.timestamps(true, true);
  });
};

/**
 * @param {import("knex").Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("student_preferences");
};
