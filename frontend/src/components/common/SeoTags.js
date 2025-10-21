import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import useSEOConfigStore from '@/store/seoConfigStore';
import { useSeoConfigContext } from '@/context/SeoConfigContext';
import { resolveSiteUrl } from '@/utils/serverApi';

const createFallbackMeta = (baseUrl, fallbackUrl) => {
  const canonicalBase = (baseUrl || fallbackUrl || '').toString().replace(/\/$/, '');
  const canonicalFor = (route) =>
    canonicalBase ? `${canonicalBase}${route === '/' ? '/' : route}` : undefined;

  return {
    '/': {
      title: 'SkillBridge | Learn, Teach, and Grow Online',
      description:
        'Explore SkillBridge for expert-led online classes, tutorials, and resources that advance your learning or teaching career.',
      keywords:
        'SkillBridge, online learning platform, freelance skills training, live virtual classes, instructor marketplace, Arabic online courses, job-ready programs',
      canonical: canonicalFor('/'),
      noindex: false,
      nofollow: false,
    },
    '/website': {
      title: 'SkillBridge | Learn, Teach, and Grow Online',
      description:
        'Explore SkillBridge for expert-led online classes, tutorials, and resources that advance your learning or teaching career.',
      keywords:
        'SkillBridge, online learning platform, freelance skills training, live virtual classes, instructor marketplace, Arabic online courses, job-ready programs',
      canonical: canonicalFor('/website'),
      noindex: false,
      nofollow: false,
    },
    '/website/student-plans': {
      title: 'SkillBridge Student Plans | Affordable Learning Memberships',
      description:
        'Compare SkillBridge student membership plans and unlock unlimited access to classes, tutorials, and resources that keep you ahead.',
      keywords:
        'SkillBridge student plans, student learning subscription, affordable online courses, unlimited classes, job-ready skills, career acceleration, e-learning for students',
      canonical: canonicalFor('/website/student-plans'),
      noindex: false,
      nofollow: false,
    },
    '/website/instructor-plans': {
      title: 'SkillBridge Instructor Plans | Monetize Your Expertise',
      description:
        'Choose the right SkillBridge instructor plan to launch courses, manage bookings, and grow your teaching business.',
      keywords:
        'SkillBridge instructor plans, teach online, monetize expertise, instructor marketplace, booking management, course monetization, educator subscription',
      canonical: canonicalFor('/website/instructor-plans'),
      noindex: false,
      nofollow: false,
    },
    '/online-classes': {
      title: 'SkillBridge Online Classes | Live Learning Experiences',
      description:
        'Browse SkillBridge online classes led by top instructors across technology, business, design, and more.',
      keywords:
        'SkillBridge online classes, live virtual classes, coding bootcamp online, business workshops, design masterclasses, finance training, tech courses',
      canonical: canonicalFor('/online-classes'),
      noindex: false,
      nofollow: false,
    },
    '/tutorials': {
      title: 'SkillBridge Tutorials | On-Demand Lessons & Guides',
      description:
        'Learn at your own pace with SkillBridge tutorials covering development, design, finance, marketing, and more.',
      keywords:
        'SkillBridge tutorials, on-demand lessons, coding tutorials, UI UX tutorials, marketing guides, video lessons, self-paced learning',
      canonical: canonicalFor('/tutorials'),
      noindex: false,
      nofollow: false,
    },
    '/blog': {
      title: 'SkillBridge Blog | Insights for Learners and Educators',
      description:
        'Read SkillBridge articles on online education trends, tips for instructors, and strategies for students to succeed.',
      keywords:
        'SkillBridge blog, edtech insights, e-learning trends, freelance career tips, remote work advice, instructor resources, student success stories',
      canonical: canonicalFor('/blog'),
      noindex: false,
      nofollow: false,
    },
    '/faqs': {
      title: 'SkillBridge FAQs | Answers for Students & Instructors',
      description:
        'Get answers to the most common questions about SkillBridge accounts, classes, payments, and policies.',
      keywords:
        'SkillBridge FAQs, student help center, instructor support, account questions, billing answers, course access help',
      canonical: canonicalFor('/faqs'),
      noindex: false,
      nofollow: false,
    },
    '/support': {
      title: 'SkillBridge Support | We’re Here to Help',
      description:
        'Submit a support ticket or browse resources to resolve issues with your SkillBridge account or classes.',
      keywords:
        'SkillBridge support, help center, technical assistance, customer service, ticket support, education platform help',
      canonical: canonicalFor('/support'),
      noindex: false,
      nofollow: false,
    },
    '/about': {
      title: 'About SkillBridge | Empowering Future Developers',
      description:
        'Discover how SkillBridge helps aspiring developers build job-ready skills and industry connections through immersive internships.',
      keywords:
        'About SkillBridge, developer mentorship, industry projects, freelance training, remote internships, edtech platform, career development',
      canonical: canonicalFor('/about'),
      noindex: false,
      nofollow: false,
    },
    '/contact': {
      title: 'Contact SkillBridge',
      description:
        'Reach out to the SkillBridge team for support, partnerships, or general inquiries about our programs.',
      keywords:
        'Contact SkillBridge, support team, partnership inquiries, enterprise training, student assistance, instructor onboarding',
      canonical: canonicalFor('/contact'),
      noindex: false,
      nofollow: false,
    },
    '/auth/login': {
      title: 'SkillBridge | Login',
      description: 'Sign in to your SkillBridge account to access classes, tutorials, and community tools.',
      canonical: canonicalFor('/auth/login'),
      noindex: true,
      nofollow: false,
    },
    '/auth/register': {
      title: 'SkillBridge | Create Account',
      description:
        'Join SkillBridge to learn from industry experts or share your knowledge with students worldwide.',
      canonical: canonicalFor('/auth/register'),
      noindex: true,
      nofollow: false,
    },
    '/auth/forgot-password': {
      title: 'Reset Your SkillBridge Password',
      description: 'Securely request a password reset link for your SkillBridge account.',
      canonical: canonicalFor('/auth/forgot-password'),
      noindex: true,
      nofollow: false,
    },
    '/auth/reset-password': {
      title: 'Choose a New SkillBridge Password',
      description: 'Enter your new password to regain access to your SkillBridge account.',
      canonical: canonicalFor('/auth/reset-password'),
      noindex: true,
      nofollow: false,
    },
    '/auth/verify-email': {
      title: 'Verify Your SkillBridge Email',
      description: 'Confirm your SkillBridge email address to activate your account.',
      canonical: canonicalFor('/auth/verify-email'),
      noindex: true,
      nofollow: false,
    },
    '/dashboard': {
      title: 'SkillBridge Dashboard',
      description: 'Access your SkillBridge dashboard to manage classes, tutorials, and settings.',
      canonical: canonicalFor('/dashboard'),
      noindex: true,
      nofollow: false,
    },
  };
};

export default function SeoTags() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const fetchConfig = useSEOConfigStore((s) => s.fetch);
  const loaded = useSEOConfigStore((s) => s.loaded);
  const storeSettings = useSEOConfigStore((s) => s.settings);
  const { settings: contextSettings } = useSeoConfigContext();

  useEffect(() => {
    if (!loaded && !contextSettings) {
      fetchConfig();
    }
  }, [loaded, contextSettings, fetchConfig]);

  const settings = useMemo(
    () => (loaded ? storeSettings : contextSettings) || {},
    [loaded, storeSettings, contextSettings]
  );

  const rawPath = router.asPath.split('?')[0] || '/';
  const localePattern =
    router.locale && rawPath.startsWith(`/${router.locale}`)
      ? new RegExp(`^/${router.locale}(?=/|$)`)
      : null;
  const normalizedPath = localePattern ? rawPath.replace(localePattern, '') || '/' : rawPath;

  const fallbackUrl = useMemo(() => resolveSiteUrl(), []);
  const baseUrl = (settings.baseUrl || fallbackUrl || '').toString().replace(/\/$/, '');

  const fallbackMeta = useMemo(
    () => createFallbackMeta(baseUrl, fallbackUrl),
    [baseUrl, fallbackUrl]
  );

  const metaSource = settings.metaTags || {};
  const ogSource = settings.openGraph || {};
  const twitterSource = settings.twitter || {};

  const meta = metaSource[normalizedPath] || fallbackMeta[normalizedPath] || {};
  const og = ogSource[normalizedPath] || {};
  const twitter = twitterSource[normalizedPath] || {};
  const twitterImage = twitter.image || og.image;

  const canonical =
    meta.canonical ||
    (settings.globalSEO?.forceCanonical && baseUrl
      ? `${baseUrl}${rawPath === '/' ? '/' : rawPath}`
      : null);
  const ogUrl = og.url || (baseUrl ? `${baseUrl}${rawPath === '/' ? '/' : rawPath}` : null);
  const ogSiteName = og.site_name || settings.siteName;

  const stripPath = normalizedPath === '/' ? '' : normalizedPath;
  const alternates = (router.locales || i18n?.options?.locales || []).map((lng) => {
    const localePath = lng === router.defaultLocale ? stripPath : `/${lng}${stripPath}`;
    return { hrefLang: lng, href: `${baseUrl}${localePath || '/'}` };
  });
  const defaultAlternate = alternates.find((a) => a.hrefLang === router.defaultLocale);

  const noindex = Boolean(settings.globalSEO?.noindexSitewide || meta.noindex);
  const nofollow = Boolean(settings.globalSEO?.nofollowSitewide || meta.nofollow);
  const robots =
    noindex || nofollow ? `${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}` : null;

  const allowedSchemaFields = ['@context', '@type', 'name', 'url', 'logo', 'sameAs'];
  let sanitizedJsonSchema;
  if (settings.jsonSchema) {
    try {
      const parsed = JSON.parse(settings.jsonSchema);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        Object.keys(parsed).every((key) => allowedSchemaFields.includes(key))
      ) {
        sanitizedJsonSchema = JSON.stringify(parsed)
          .replace(/</g, '\\u003c')
          .replace(/>/g, '\\u003e')
          .replace(/&/g, '\\u0026');
      }
    } catch {
      // ignore invalid JSON
    }
  }

  return (
    <Head>
      {meta.title && <title>{meta.title}</title>}
      {meta.description && <meta name="description" content={meta.description} />}
      {meta.keywords && <meta name="keywords" content={meta.keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {alternates.map(({ hrefLang, href }) => (
        <link key={`alt-${hrefLang}`} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}
      {defaultAlternate && (
        <link rel="alternate" hrefLang="x-default" href={defaultAlternate.href} />
      )}
      {robots && <meta name="robots" content={robots} />}
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      {ogSiteName && <meta property="og:site_name" content={ogSiteName} />}
      {Object.entries(og)
        .filter(([k]) => !['url', 'site_name'].includes(k))
        .map(([k, v]) => (v ? <meta key={`og-${k}`} property={`og:${k}`} content={v} /> : null))}
      {twitter.cardType && <meta name="twitter:card" content={twitter.cardType} />}
      {twitter.title && <meta name="twitter:title" content={twitter.title} />}
      {twitter.description && <meta name="twitter:description" content={twitter.description} />}
      {twitterImage && <meta name="twitter:image" content={twitterImage} />}
      {twitter.handle && <meta name="twitter:site" content={twitter.handle} />}
      {twitter.handle && <meta name="twitter:creator" content={twitter.handle} />}
      {sanitizedJsonSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sanitizedJsonSchema }} />
      )}
    </Head>
  );
}
