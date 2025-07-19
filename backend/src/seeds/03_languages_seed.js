exports.seed = async function (knex) {
  await knex('languages').del();
  await knex('languages').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      code: 'en',
      name: 'English',
      is_default: true,
      is_active: true,
      icon_url: null,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      code: 'ar',
      name: 'العربية',
      is_default: false,
      is_active: true,
      icon_url: null,
    },
  ]);
};
