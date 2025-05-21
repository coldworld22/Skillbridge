exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn("instructor_profiles", "demo_video_url");

  if (!hasColumn) {
    await knex.schema.alterTable("instructor_profiles", (table) => {
      table.text("demo_video_url");
    });
  }
};

exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn("instructor_profiles", "demo_video_url");

  if (hasColumn) {
    await knex.schema.alterTable("instructor_profiles", (table) => {
      table.dropColumn("demo_video_url");
    });
  }
};
