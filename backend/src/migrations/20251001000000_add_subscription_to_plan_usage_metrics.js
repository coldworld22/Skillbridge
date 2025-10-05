exports.up = async function (knex) {
  const FALLBACK_ID = '00000000-0000-0000-0000-000000000000';

  await knex.schema.alterTable('plan_usage_metrics', (table) => {
    table
      .uuid('subscription_id')
      .notNullable()
      .defaultTo(knex.raw(`'${FALLBACK_ID}'::uuid`));
  });

  await knex('plan_usage_metrics').update({ subscription_id: FALLBACK_ID });

  await knex.raw(
    'ALTER TABLE plan_usage_metrics DROP CONSTRAINT IF EXISTS plan_usage_metrics_pkey'
  );

  await knex.raw(
    'ALTER TABLE plan_usage_metrics ADD CONSTRAINT plan_usage_metrics_pkey PRIMARY KEY (plan_id, subscription_id, item_type, item_id)'
  );

  await knex.raw(
    'ALTER TABLE plan_usage_metrics ALTER COLUMN subscription_id DROP DEFAULT'
  );
};

exports.down = async function (knex) {
  await knex.raw(
    'ALTER TABLE plan_usage_metrics DROP CONSTRAINT IF EXISTS plan_usage_metrics_pkey'
  );

  await knex.schema.alterTable('plan_usage_metrics', (table) => {
    table.dropColumn('subscription_id');
    table.primary(['plan_id', 'item_type', 'item_id']);
  });
};
