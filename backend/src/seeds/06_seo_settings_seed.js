exports.seed = async function (knex) {
  await knex('settings').where({ key: 'seo_settings' }).del();
  const now = new Date();
  const APP_DOMAIN = process.env.APP_DOMAIN || 'example.com';
  const BASE_URL = `https://${APP_DOMAIN}`;
  const config = {
    baseUrl: BASE_URL,
    siteName: 'SkillBridge',
    metaTags: {
      '/': {
        title: 'SkillBridge | Launch Your Tech Career',
        description:
          'Gain real-world coding experience through mentored, project-based internships that accelerate your path to a software career.',
        keywords:
          'SkillBridge, software internships, coding experience, tech career, portfolio',
        canonical: `${BASE_URL}/`,
        noindex: false,
        nofollow: false,
      },
      '/about': {
        title: 'About SkillBridge | Empowering Future Developers',
        description:
          'Discover how SkillBridge helps aspiring developers build job-ready skills and industry connections through immersive internships.',
        keywords: 'about SkillBridge, developer mentorship, real projects',
        canonical: `${BASE_URL}/about`,
        noindex: false,
        nofollow: false,
      },
      '/contact': {
        title: 'Contact SkillBridge',
        description:
          'Reach out to the SkillBridge team for support, partnerships, or general inquiries about our programs.',
        keywords: 'contact SkillBridge, support, partnership inquiries',
        canonical: `${BASE_URL}/contact`,
        noindex: false,
        nofollow: false,
      },
    },
    sitemap: [
      { path: '/', include: true, priority: 1.0, freq: 'daily' },
      { path: '/about', include: true, priority: 0.8, freq: 'monthly' },
      { path: '/contact', include: true, priority: 0.6, freq: 'monthly' },
    ],
    robots:
      `User-agent: *\nDisallow: /dashboard/\nDisallow: /admin/\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml`,
    openGraph: {
      '/': {
        title: 'SkillBridge | Launch Your Tech Career',
        description:
          'Gain real-world coding experience through mentored, project-based internships that accelerate your path to a software career.',
        type: 'website',
        image: `${BASE_URL}/images/seo/og-default.jpg`,
      },
      '/about': {
        title: 'About SkillBridge | Empowering Future Developers',
        description:
          'Discover how SkillBridge helps aspiring developers build job-ready skills and industry connections through immersive internships.',
        type: 'article',
        image: `${BASE_URL}/images/seo/og-default.jpg`,
      },
      '/contact': {
        title: 'Contact SkillBridge',
        description:
          'Reach out to the SkillBridge team for support, partnerships, or general inquiries about our programs.',
        type: 'website',
        image: `${BASE_URL}/images/seo/og-default.jpg`,
      },
    },
    twitter: {
      '/': {
        title: 'SkillBridge | Launch Your Tech Career',
        description:
          'Gain real-world coding experience through mentored, project-based internships that accelerate your path to a software career.',
        cardType: 'summary_large_image',
        image: `${BASE_URL}/images/seo/og-default.jpg`,
        handle: '@SkillBridge',
      },
      '/about': {
        title: 'About SkillBridge | Empowering Future Developers',
        description:
          'Discover how SkillBridge helps aspiring developers build job-ready skills and industry connections through immersive internships.',
        cardType: 'summary_large_image',
        image: `${BASE_URL}/images/seo/og-default.jpg`,
        handle: '@SkillBridge',
      },
      '/contact': {
        title: 'Contact SkillBridge',
        description:
          'Reach out to the SkillBridge team for support, partnerships, or general inquiries about our programs.',
        cardType: 'summary_large_image',
        image: `${BASE_URL}/images/seo/og-default.jpg`,
        handle: '@SkillBridge',
      },
    },
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
