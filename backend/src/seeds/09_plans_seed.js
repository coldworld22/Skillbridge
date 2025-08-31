exports.seed = async function (knex) {
  await knex('plan_features').del();
  await knex('plans').del();

  const now = knex.fn.now();

  const plans = [
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Basic',
      slug: 'basic',
      price_monthly: 0,
      price_yearly: 0,
      currency: 'USD',
      recommended: false,
      active: true,
      color: '#1F2937',
      style: JSON.stringify({
        gradientStart: '#1F2937',
        gradientEnd: '#374151',
        buttonColor: '#2563EB',
        buttonTextColor: '#FFFFFF'
      }),
      target_role: 'student',
      created_at: now,
      updated_at: now
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Regular',
      slug: 'regular',
      price_monthly: 9.99,
      price_yearly: 99.99,
      currency: 'USD',
      recommended: true,
      active: true,
      color: '#4F46E5',
      style: JSON.stringify({
        gradientStart: '#4338CA',
        gradientEnd: '#3B82F6',
        buttonColor: '#3B82F6',
        buttonTextColor: '#FFFFFF'
      }),
      target_role: 'student',
      created_at: now,
      updated_at: now
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Prime',
      slug: 'prime',
      price_monthly: 19.99,
      price_yearly: 199.99,
      currency: 'USD',
      recommended: false,
      active: true,
      color: '#10B981',
      style: JSON.stringify({
        gradientStart: '#059669',
        gradientEnd: '#10B981',
        buttonColor: '#34D399',
        buttonTextColor: '#FFFFFF'
      }),
      target_role: 'student',
      created_at: now,
      updated_at: now
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Instructor Basic',
      slug: 'instructor-basic',
      price_monthly: 0,
      price_yearly: 0,
      currency: 'USD',
      recommended: false,
      active: true,
      color: '#1F2937',
      style: JSON.stringify({
        gradientStart: '#1F2937',
        gradientEnd: '#374151',
        buttonColor: '#2563EB',
        buttonTextColor: '#FFFFFF'
      }),
      target_role: 'instructor',
      max_courses: 5,
      ad_credits: 10,
      created_at: now,
      updated_at: now
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Instructor Pro',
      slug: 'instructor-pro',
      price_monthly: 29.99,
      price_yearly: 299.99,
      currency: 'USD',
      recommended: true,
      active: true,
      color: '#F59E0B',
      style: JSON.stringify({
        gradientStart: '#F59E0B',
        gradientEnd: '#D97706',
        textColor: '#1F2937',
        buttonColor: '#FBBF24',
        buttonTextColor: '#1F2937'
      }),
      target_role: 'instructor',
      max_courses: 50,
      ad_credits: 100,
      created_at: now,
      updated_at: now
    }
  ];

  await knex('plans').insert(plans);

  const planRows = await knex('plans').select('id', 'slug');
  const ids = planRows.reduce((acc, row) => {
    acc[row.slug] = row.id;
    return acc;
  }, {});

  await knex('plan_features').insert([
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.basic,
      feature_key: 'ads_max_ads',
      value: '1',
      description: 'Up to 1 active ad'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.basic,
      feature_key: 'ads_max_ad_duration',
      value: '3',
      description: 'Each ad runs for 3 days'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.basic,
      feature_key: 'ads_placements',
      value: JSON.stringify(['dashboard']),
      description: 'Dashboard placement only'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.basic,
      feature_key: 'ads_allow_branding',
      value: 'false',
      description: 'No custom branding'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.basic,
      feature_key: 'ads_show_analytics',
      value: 'false',
      description: 'No analytics access'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.basic,
      feature_key: 'groups_create',
      value: 'false',
      description: 'Cannot create groups'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.basic,
      feature_key: 'groups_join_limit',
      value: '1',
      description: 'Join up to 1 group'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.regular,
      feature_key: 'ads_max_ads',
      value: '3',
      description: 'Up to 3 active ads'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.regular,
      feature_key: 'ads_max_ad_duration',
      value: '7',
      description: 'Each ad runs for 7 days'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.regular,
      feature_key: 'ads_placements',
      value: JSON.stringify(['dashboard','homepage']),
      description: 'Dashboard & homepage placements'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.regular,
      feature_key: 'ads_allow_branding',
      value: 'false',
      description: 'No custom branding'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.regular,
      feature_key: 'ads_show_analytics',
      value: 'true',
      description: 'Analytics access'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.regular,
      feature_key: 'groups_create',
      value: 'true',
      description: 'Can create groups'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.regular,
      feature_key: 'groups_join_limit',
      value: '5',
      description: 'Join up to 5 groups'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.prime,
      feature_key: 'ads_max_ads',
      value: '10',
      description: 'Up to 10 active ads'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.prime,
      feature_key: 'ads_max_ad_duration',
      value: '30',
      description: 'Each ad runs for 30 days'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.prime,
      feature_key: 'ads_placements',
      value: JSON.stringify(['dashboard','homepage','sidebar']),
      description: 'All ad placements'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.prime,
      feature_key: 'ads_allow_branding',
      value: 'true',
      description: 'Custom branding'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.prime,
      feature_key: 'ads_show_analytics',
      value: 'true',
      description: 'Analytics access'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.prime,
      feature_key: 'groups_create',
      value: 'true',
      description: 'Can create groups'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids.prime,
      feature_key: 'groups_join_limit',
      value: 'unlimited',
      description: 'Join unlimited groups'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids['instructor-basic'],
      feature_key: 'commission_rate',
      value: '0.2',
      description: '20% commission on sales'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids['instructor-basic'],
      feature_key: 'ads_max_ads',
      value: '2',
      description: 'Up to 2 active ads'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids['instructor-basic'],
      feature_key: 'ads_show_analytics',
      value: 'false',
      description: 'No analytics access'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids['instructor-basic'],
      feature_key: 'groups_create',
      value: 'true',
      description: 'Can create groups'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids['instructor-basic'],
      feature_key: 'groups_join_limit',
      value: '3',
      description: 'Join up to 3 groups'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids['instructor-pro'],
      feature_key: 'commission_rate',
      value: '0.1',
      description: '10% commission on sales'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids['instructor-pro'],
      feature_key: 'ads_max_ads',
      value: '10',
      description: 'Up to 10 active ads'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids['instructor-pro'],
      feature_key: 'ads_allow_branding',
      value: 'true',
      description: 'Custom branding'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids['instructor-pro'],
      feature_key: 'ads_show_analytics',
      value: 'true',
      description: 'Analytics access'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids['instructor-pro'],
      feature_key: 'groups_create',
      value: 'true',
      description: 'Can create groups'
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      plan_id: ids['instructor-pro'],
      feature_key: 'groups_join_limit',
      value: 'unlimited',
      description: 'Join unlimited groups'
    }
  ]);
};

