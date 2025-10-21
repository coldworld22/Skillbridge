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
        title: 'SkillBridge | Learn, Teach, and Grow Online',
        description:
          'Explore SkillBridge for expert-led online classes, tutorials, and resources that advance your learning or teaching career.',
        keywords:
          'SkillBridge, online learning platform, freelance skills training, live virtual classes, instructor marketplace, Arabic online courses, job-ready programs',
        canonical: `${BASE_URL}/`,
        noindex: false,
        nofollow: false,
      },
      '/about': {
        title: 'About SkillBridge | Empowering Future Developers',
        description:
          'Discover how SkillBridge helps aspiring developers build job-ready skills and industry connections through immersive internships.',
        keywords:
          'About SkillBridge, developer mentorship, industry projects, freelance training, remote internships, edtech platform, career development',
        canonical: `${BASE_URL}/about`,
        noindex: false,
        nofollow: false,
      },
      '/contact': {
        title: 'Contact SkillBridge',
        description:
          'Reach out to the SkillBridge team for support, partnerships, or general inquiries about our programs.',
        keywords:
          'Contact SkillBridge, support team, partnership inquiries, enterprise training, student assistance, instructor onboarding',
        canonical: `${BASE_URL}/contact`,
        noindex: false,
        nofollow: false,
      },
      '/website': {
        title: 'SkillBridge | Learn, Teach, and Grow Online',
        description:
          'Explore SkillBridge for expert-led online classes, tutorials, and resources that advance your learning or teaching career.',
        keywords:
          'SkillBridge, online learning platform, freelance skills training, live virtual classes, instructor marketplace, Arabic online courses, job-ready programs',
        canonical: `${BASE_URL}/website`,
        noindex: false,
        nofollow: false,
      },
      '/website/student-plans': {
        title: 'SkillBridge Student Plans | Affordable Learning Memberships',
        description:
          'Compare SkillBridge student membership plans and unlock unlimited access to classes, tutorials, and resources that keep you ahead.',
        keywords:
          'SkillBridge student plans, student learning subscription, affordable online courses, unlimited classes, job-ready skills, career acceleration, e-learning for students',
        canonical: `${BASE_URL}/website/student-plans`,
        noindex: false,
        nofollow: false,
      },
      '/website/instructor-plans': {
        title: 'SkillBridge Instructor Plans | Monetize Your Expertise',
        description:
          'Choose the right SkillBridge instructor plan to launch courses, manage bookings, and grow your teaching business.',
        keywords:
          'SkillBridge instructor plans, teach online, monetize expertise, instructor marketplace, booking management, course monetization, educator subscription',
        canonical: `${BASE_URL}/website/instructor-plans`,
        noindex: false,
        nofollow: false,
      },
      '/online-classes': {
        title: 'SkillBridge Online Classes | Live Learning Experiences',
        description:
          'Browse SkillBridge online classes led by top instructors across technology, business, design, and more.',
        keywords:
          'SkillBridge online classes, live virtual classes, coding bootcamp online, business workshops, design masterclasses, finance training, tech courses',
        canonical: `${BASE_URL}/online-classes`,
        noindex: false,
        nofollow: false,
      },
      '/tutorials': {
        title: 'SkillBridge Tutorials | On-Demand Lessons & Guides',
        description:
          'Learn at your own pace with SkillBridge tutorials covering development, design, finance, marketing, and more.',
        keywords:
          'SkillBridge tutorials, on-demand lessons, coding tutorials, UI UX tutorials, marketing guides, video lessons, self-paced learning',
        canonical: `${BASE_URL}/tutorials`,
        noindex: false,
        nofollow: false,
      },
      '/blog': {
        title: 'SkillBridge Blog | Insights for Learners and Educators',
        description:
          'Read SkillBridge articles on online education trends, tips for instructors, and strategies for students to succeed.',
        keywords:
          'SkillBridge blog, edtech insights, e-learning trends, freelance career tips, remote work advice, instructor resources, student success stories',
        canonical: `${BASE_URL}/blog`,
        noindex: false,
        nofollow: false,
      },
      '/faqs': {
        title: 'SkillBridge FAQs | Answers for Students & Instructors',
        description:
          'Get answers to the most common questions about SkillBridge accounts, classes, payments, and policies.',
        keywords:
          'SkillBridge FAQs, student help center, instructor support, account questions, billing answers, course access help',
        canonical: `${BASE_URL}/faqs`,
        noindex: false,
        nofollow: false,
      },
      '/support': {
        title: 'SkillBridge Support | We’re Here to Help',
        description:
          'Submit a support ticket or browse resources to resolve issues with your SkillBridge account or classes.',
        keywords:
          'SkillBridge support, help center, technical assistance, customer service, ticket support, education platform help',
        canonical: `${BASE_URL}/support`,
        noindex: false,
        nofollow: false,
      },
      '/auth/login': {
        title: 'SkillBridge | Login',
        description: 'Sign in to your SkillBridge account to access classes, tutorials, and community tools.',
        canonical: `${BASE_URL}/auth/login`,
        noindex: true,
        nofollow: false,
      },
      '/auth/register': {
        title: 'SkillBridge | Create Account',
        description: 'Join SkillBridge to learn from industry experts or share your knowledge with students worldwide.',
        canonical: `${BASE_URL}/auth/register`,
        noindex: true,
        nofollow: false,
      },
      '/auth/forgot-password': {
        title: 'Reset Your SkillBridge Password',
        description: 'Securely request a password reset link for your SkillBridge account.',
        canonical: `${BASE_URL}/auth/forgot-password`,
        noindex: true,
        nofollow: false,
      },
      '/auth/reset-password': {
        title: 'Choose a New SkillBridge Password',
        description: 'Enter your new password to regain access to your SkillBridge account.',
        canonical: `${BASE_URL}/auth/reset-password`,
        noindex: true,
        nofollow: false,
      },
      '/auth/verify-email': {
        title: 'Verify Your SkillBridge Email',
        description: 'Confirm your SkillBridge email address to activate your account.',
        canonical: `${BASE_URL}/auth/verify-email`,
        noindex: true,
        nofollow: false,
      },
      '/dashboard': {
        title: 'SkillBridge Dashboard',
        description: 'Access your SkillBridge dashboard to manage classes, tutorials, and settings.',
        canonical: `${BASE_URL}/dashboard`,
        noindex: true,
        nofollow: false,
      },
    },
    sitemap: [
      { path: '/website', include: true, priority: 1.0, freq: 'daily' },
      { path: '/website/student-plans', include: true, priority: 0.8, freq: 'weekly' },
      { path: '/website/instructor-plans', include: true, priority: 0.8, freq: 'weekly' },
      { path: '/online-classes', include: true, priority: 0.9, freq: 'daily' },
      { path: '/tutorials', include: true, priority: 0.8, freq: 'daily' },
      { path: '/blog', include: true, priority: 0.6, freq: 'weekly' },
      { path: '/about', include: true, priority: 0.8, freq: 'monthly' },
      { path: '/contact', include: true, priority: 0.6, freq: 'monthly' },
      { path: '/faqs', include: true, priority: 0.6, freq: 'monthly' },
      { path: '/support', include: true, priority: 0.6, freq: 'monthly' },
      { path: '/auth/login', include: false },
      { path: '/auth/register', include: false },
      { path: '/auth/forgot-password', include: false },
      { path: '/auth/reset-password', include: false },
      { path: '/dashboard', include: false },
    ],
    robots:
      `User-agent: *\nDisallow: /dashboard/\nDisallow: /admin/\nDisallow: /auth/\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml`,
    openGraph: {
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
      '/website': {
        title: 'SkillBridge | Learn, Teach, and Grow Online',
        description:
          'Explore SkillBridge for expert-led online classes, tutorials, and resources that advance your learning or teaching career.',
        type: 'website',
        image: `${BASE_URL}/images/seo/og-website.jpg`,
      },
      '/website/student-plans': {
        title: 'SkillBridge Student Plans | Affordable Learning Memberships',
        description:
          'Unlock unlimited SkillBridge learning with student memberships tailored to every budget.',
        type: 'product',
        image: `${BASE_URL}/images/seo/og-student-plans.jpg`,
      },
      '/website/instructor-plans': {
        title: 'SkillBridge Instructor Plans | Monetize Your Expertise',
        description:
          'Grow your teaching business with SkillBridge instructor plans designed for every stage.',
        type: 'product',
        image: `${BASE_URL}/images/seo/og-instructor-plans.jpg`,
      },
      '/online-classes': {
        title: 'SkillBridge Online Classes',
        description:
          'Join live SkillBridge online classes led by top instructors in tech, business, and creative fields.',
        type: 'website',
        image: `${BASE_URL}/images/seo/og-online-classes.jpg`,
      },
      '/tutorials': {
        title: 'SkillBridge Tutorials',
        description:
          'On-demand SkillBridge tutorials and guides that help you master new skills step by step.',
        type: 'website',
        image: `${BASE_URL}/images/seo/og-tutorials.jpg`,
      },
      '/blog': {
        title: 'SkillBridge Blog',
        description:
          'Insights and stories for learners and educators navigating the future of online education.',
        type: 'article',
        image: `${BASE_URL}/images/seo/og-blog.jpg`,
      },
      '/faqs': {
        title: 'SkillBridge FAQs',
        description:
          'Answers to the most common questions about SkillBridge accounts, payments, and features.',
        type: 'website',
        image: `${BASE_URL}/images/seo/og-default.jpg`,
      },
      '/support': {
        title: 'SkillBridge Support',
        description:
          'Get help fast—submit a ticket or browse support resources for your SkillBridge account.',
        type: 'website',
        image: `${BASE_URL}/images/seo/og-support.jpg`,
      },
    },
    twitter: {
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
      '/website': {
        title: 'SkillBridge | Learn, Teach, and Grow Online',
        description:
          'Discover SkillBridge online classes, tutorials, and plans designed for ambitious learners and instructors.',
        cardType: 'summary_large_image',
        image: `${BASE_URL}/images/seo/og-website.jpg`,
        handle: '@SkillBridge',
      },
      '/website/student-plans': {
        title: 'SkillBridge Student Plans',
        description:
          'Choose the SkillBridge student membership that best fits your goals and budget.',
        cardType: 'summary_large_image',
        image: `${BASE_URL}/images/seo/og-student-plans.jpg`,
        handle: '@SkillBridge',
      },
      '/website/instructor-plans': {
        title: 'SkillBridge Instructor Plans',
        description:
          'Select the right SkillBridge instructor plan to monetize your expertise.',
        cardType: 'summary_large_image',
        image: `${BASE_URL}/images/seo/og-instructor-plans.jpg`,
        handle: '@SkillBridge',
      },
      '/online-classes': {
        title: 'SkillBridge Online Classes',
        description:
          'Find live SkillBridge classes taught by industry experts in tech, business, design, and more.',
        cardType: 'summary_large_image',
        image: `${BASE_URL}/images/seo/og-online-classes.jpg`,
        handle: '@SkillBridge',
      },
      '/tutorials': {
        title: 'SkillBridge Tutorials',
        description:
          'Learn new skills anytime with SkillBridge tutorials covering coding, design, marketing, and more.',
        cardType: 'summary_large_image',
        image: `${BASE_URL}/images/seo/og-tutorials.jpg`,
        handle: '@SkillBridge',
      },
      '/blog': {
        title: 'SkillBridge Blog',
        description:
          'Stay informed with the latest insights and stories from the SkillBridge community.',
        cardType: 'summary_large_image',
        image: `${BASE_URL}/images/seo/og-blog.jpg`,
        handle: '@SkillBridge',
      },
      '/support': {
        title: 'SkillBridge Support',
        description:
          'Need help? Connect with SkillBridge support or browse troubleshooting tips.',
        cardType: 'summary_large_image',
        image: `${BASE_URL}/images/seo/og-support.jpg`,
        handle: '@SkillBridge',
      },
    },
    globalSEO: {
      forceCanonical: true,
      noindexSitewide: false,
      nofollowSitewide: false,
      autoPingSitemap: true,
    },
    redirects: [
      { from: '/home', to: '/website', code: 301 },
      { from: '/', to: '/website', code: 301 },
      { from: '/login', to: '/auth/login', code: 302 },
      { from: '/signup', to: '/auth/register', code: 302 },
    ],
    jsonSchema: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'SkillBridge',
      url: BASE_URL,
      logo: `${BASE_URL}/images/logo.svg`,
      sameAs: [
        'https://www.facebook.com/skillbridge',
        'https://www.twitter.com/skillbridge',
        'https://www.linkedin.com/company/skillbridge',
        'https://www.youtube.com/@skillbridge'
      ],
      foundingDate: '2020-01-15',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: `support@${APP_DOMAIN}`,
        url: `${BASE_URL}/support`,
        availableLanguage: ['en', 'ar']
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Learning Ave',
        addressLocality: 'Dubai',
        addressCountry: 'AE'
      }
    }),
  };
  await knex('settings').insert({
    key: 'seo_settings',
    value: JSON.stringify(config),
    created_at: now,
    updated_at: now,
  });
};
