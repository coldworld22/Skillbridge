exports.seed = async function(knex) {
  await knex('payments').del();
  await knex('payment_methods_config').del();
  const now = knex.fn.now();
  await knex('payment_methods_config').insert([
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Bank Transfer',
      type: 'bank',
      icon: null,
      active: true,
      settings: {
        bank_name: 'Sample Bank',
        account_number: '123456789',
        iban: 'DE89370400440532013000',
        instructions: 'Transfer to the above account and upload your receipt for verification.'
      },
      is_default: true,
      created_at: now,
      updated_at: now
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'paypal',
      type: 'paypal',
      icon: 'paypal',
      active: true,
      settings: {
        client_id: '',
        client_secret: '',
        mode: 'sandbox'
      },
      is_default: false,
      created_at: now,
      updated_at: now
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'stripe',
      type: 'stripe',
      icon: 'stripe',
      active: false,
      settings: {},
      is_default: false,
      created_at: now,
      updated_at: now
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'coinbase',
      type: 'coinbase',
      icon: 'coinbase',
      active: false,
      settings: {},
      is_default: false,
      created_at: now,
      updated_at: now
    }
  ]);
};
