exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('class_lessons', 'topic_file_url');
  if (!exists) {
    await knex.schema.alterTable('class_lessons', (table) => {
      table.string('topic_file_url');
    });
  }
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn('class_lessons', 'topic_file_url');
  if (exists) {
    await knex.schema.alterTable('class_lessons', (table) => {
      table.dropColumn('topic_file_url');
    });
  }
};
