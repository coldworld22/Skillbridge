exports.up = async function up(knex) {
  await knex.raw(
    'ALTER TABLE payments ALTER COLUMN item_id TYPE text USING item_id::text'
  );
  await knex.raw(
    'ALTER TABLE plan_usage_metrics ALTER COLUMN item_id TYPE text USING item_id::text'
  );
};

exports.down = async function down(knex) {
  const invalidPayments = await knex('payments')
    .whereNotNull('item_id')
    .whereRaw(
      "item_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'"
    );
  if (invalidPayments.length) {
    throw new Error(
      'Cannot revert migration: payments.item_id contains non-UUID values'
    );
  }

  const invalidMetrics = await knex('plan_usage_metrics')
    .whereNotNull('item_id')
    .whereRaw(
      "item_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'"
    );
  if (invalidMetrics.length) {
    throw new Error(
      'Cannot revert migration: plan_usage_metrics.item_id contains non-UUID values'
    );
  }

  await knex.raw(
    'ALTER TABLE plan_usage_metrics ALTER COLUMN item_id TYPE uuid USING item_id::uuid'
  );
  await knex.raw(
    'ALTER TABLE payments ALTER COLUMN item_id TYPE uuid USING item_id::uuid'
  );
};
