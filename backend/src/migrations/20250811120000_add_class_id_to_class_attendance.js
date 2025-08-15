exports.up = async function(knex) {
  // add class_id column to class_attendance if not exists
  const hasClassId = await knex.schema.hasColumn('class_attendance', 'class_id');
  if (!hasClassId) {
    await knex.schema.table('class_attendance', function(table) {
      table
        .uuid('class_id')
        .references('id')
        .inTable('online_classes')
        .onDelete('CASCADE');
    });

    // populate class_id based on lesson_id
    await knex.raw(`
      UPDATE class_attendance AS ca
      SET class_id = cl.class_id
      FROM class_lessons AS cl
      WHERE ca.lesson_id = cl.id
    `);

    // ensure not nullable after population
    await knex.schema.alterTable('class_attendance', function(table) {
      table.uuid('class_id').notNullable().alter();
    });
  }
};

exports.down = async function(knex) {
  const hasClassId = await knex.schema.hasColumn('class_attendance', 'class_id');
  if (hasClassId) {
    await knex.schema.table('class_attendance', function(table) {
      table.dropColumn('class_id');
    });
  }
};
