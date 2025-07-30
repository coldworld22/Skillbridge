exports.seed = async function(knex) {
  await knex('coupons').del();
  const instructors = await knex('users').where({ role: 'instructor' }).select('id').limit(1);
  await knex('coupons').insert([
    {
      id: knex.raw('uuid_generate_v4()'),
      code: 'DISCOUNT10',
      discount_percent: 10,
      expires_at: knex.fn.now(),
      usage_limit: 100,
      instructor_id: instructors.length ? instructors[0].id : null,
    },
  ]);
};
