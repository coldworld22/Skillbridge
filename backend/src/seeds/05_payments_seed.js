exports.seed = async function(knex) {
  await knex('payments').del();

  const users = await knex('users').select('id').limit(1);
  const methods = await knex('payment_methods_config').select('id').limit(1);

  if (users.length && methods.length) {
    await knex('payments').insert([
      {
        id: knex.raw('uuid_generate_v4()'),
        user_id: users[0].id,
        method_id: methods[0].id,
        item_type: 'class',
        item_id: knex.raw('uuid_generate_v4()'),
        amount: 99.99,
        currency: 'USD',
        status: 'paid',
        paid_at: knex.fn.now(),
        receipt_url: null,
      },
    ]);
  }
};
