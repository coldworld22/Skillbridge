exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('online_classes', 'demo_video_url');
  if (!exists) {
    await knex.schema.alterTable('online_classes', table => {
      table.string('demo_video_url', 1024);
    });
  }
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn('online_classes', 'demo_video_url');
  if (exists) {
    await knex.schema.alterTable('online_classes', table => {
      table.dropColumn('demo_video_url');
    });
  }
};
