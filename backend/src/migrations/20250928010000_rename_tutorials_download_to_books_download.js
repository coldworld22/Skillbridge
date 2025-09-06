exports.up = async function(knex) {
  await knex('plan_features')
    .where({ feature_key: 'tutorials_download' })
    .update({ feature_key: 'books_download' });
};

exports.down = async function(knex) {
  await knex('plan_features')
    .where({ feature_key: 'books_download' })
    .update({ feature_key: 'tutorials_download' });
};
