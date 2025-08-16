exports.seed = async function(knex) {
  await knex('payment_methods_config').del();
  const now = knex.fn.now();
  await knex('payment_methods_config').insert([
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Bank Transfer',
      type: 'manual',
      icon: null,
      active: true,
      settings: {
        bankName: 'Sample Bank',
        accountHolderName: 'John Doe',
        accountNumber: '123456789',
        iban: 'DE89370400440532013000',
        swiftCode: 'COBADEFFXXX',
        branchAddress: '1234 Elm Street, City, Country',
        extraInstructions:
          'Transfer to the above account and upload your receipt for verification.'
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
        client_secret: ''
      },
      is_default: false,
      created_at: now,
      updated_at: now
    }
  ]);
};
