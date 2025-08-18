exports.seed = async function (knex) {
  await knex('settings').where({ key: 'seo_settings' }).del();
  const now = new Date();
  const config = {
    metaTags: {},
    sitemap: [
      { path: '/', include: true, priority: 1.0, freq: 'daily' },
    ],
    robots: '',
    openGraph: {},
    twitter: {},
    globalSEO: {
      forceCanonical: true,
      noindexSitewide: false,
      nofollowSitewide: false,
      autoPingSitemap: true,
    },
    redirects: [],
    jsonSchema: '',
  };
  await knex('settings').insert({
    key: 'seo_settings',
    value: JSON.stringify(config),
    created_at: now,
    updated_at: now,
  });
};
