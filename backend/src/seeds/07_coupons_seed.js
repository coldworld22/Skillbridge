exports.seed = async function(knex) {
  await knex('coupons').del();
  const instructors = await knex('users').where({ role: 'instructor' }).select('id').limit(1);
  await knex('coupons').insert([
    {
      id: knex.raw('uuid_generate_v4()'),
      code: 'DISCOUNT10',
      discount_percent: 10,
      starts_at: knex.fn.now(),
      expires_at: knex.raw("NOW() + INTERVAL '7 months'"),
      usage_limit: 100,
      applies_to: 'plan',
      applies_to_id: null,
      instructor_id: instructors.length ? instructors[0].id : null,
    },
  ]);
};
