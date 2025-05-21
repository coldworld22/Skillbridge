// 📁 migrations/20250519225948_add_demo_video_to_instructor_profiles.js

exports.up = async function(knex) {
  await knex.schema.alterTable("instructor_profiles", (table) => {
    table.string("demo_video_url", 1024); // optional
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable("instructor_profiles", (table) => {
    table.dropColumn("demo_video_url");
  });
};
