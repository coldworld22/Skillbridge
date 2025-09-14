exports.up = function (knex) {
  return Promise.all([
    knex.schema.alterTable('tutorials', table => {
      table.index('instructor_id', 'idx_tutorials_instructor_id');
    }),
    knex.schema.alterTable('tutorial_reviews', table => {
      table.index('tutorial_id', 'idx_tutorial_reviews_tutorial_id');
    }),
    knex.schema.alterTable('tutorial_comments', table => {
      table.index('tutorial_id', 'idx_tutorial_comments_tutorial_id');
    }),
    knex.schema.alterTable('tutorial_enrollments', table => {
      table.index('tutorial_id', 'idx_tutorial_enrollments_tutorial_id');
    }),
    knex.schema.alterTable('tutorial_views', table => {
      table.index('tutorial_id', 'idx_tutorial_views_tutorial_id');
    })
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.alterTable('tutorials', table => {
      table.dropIndex('instructor_id', 'idx_tutorials_instructor_id');
    }),
    knex.schema.alterTable('tutorial_reviews', table => {
      table.dropIndex('tutorial_id', 'idx_tutorial_reviews_tutorial_id');
    }),
    knex.schema.alterTable('tutorial_comments', table => {
      table.dropIndex('tutorial_id', 'idx_tutorial_comments_tutorial_id');
    }),
    knex.schema.alterTable('tutorial_enrollments', table => {
      table.dropIndex('tutorial_id', 'idx_tutorial_enrollments_tutorial_id');
    }),
    knex.schema.alterTable('tutorial_views', table => {
      table.dropIndex('tutorial_id', 'idx_tutorial_views_tutorial_id');
    })
  ]);
};
