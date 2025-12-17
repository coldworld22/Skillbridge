exports.up = function (knex) {
  return knex.raw(
    'CREATE UNIQUE INDEX IF NOT EXISTS tutorial_enrollments_user_id_tutorial_id_unique ON tutorial_enrollments (user_id, tutorial_id)'
  );
};

exports.down = function (knex) {
  // Drop the unique constraint first to avoid dependency errors, then drop the index.
  return knex.schema
    .alterTable('tutorial_enrollments', (table) => {
      table.dropUnique(
        ['user_id', 'tutorial_id'],
        'tutorial_enrollments_user_id_tutorial_id_unique'
      );
    })
    .then(() =>
      knex.raw(
        'DROP INDEX IF EXISTS tutorial_enrollments_user_id_tutorial_id_unique'
      )
    );
};
