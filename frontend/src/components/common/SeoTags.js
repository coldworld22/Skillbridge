import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import useSEOConfigStore from '@/store/seoConfigStore';

export default function SeoTags() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const path = router.asPath.split('?')[0] || '/';
  const fetchConfig = useSEOConfigStore((s) => s.fetch);
  const loaded = useSEOConfigStore((s) => s.loaded);
  const settings = useSEOConfigStore((s) => s.settings);

  useEffect(() => {
    if (!loaded) fetchConfig();
  }, [loaded, fetchConfig]);

  const meta = settings.metaTags?.[path] || {};
  const og = settings.openGraph?.[path] || {};
  const twitter = settings.twitter?.[path] || {};
  const twitterImage = twitter.image || og.image;

  const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const baseUrl = settings.baseUrl || fallbackUrl;
  const canonical = meta.canonical || (settings.globalSEO?.forceCanonical ? `${baseUrl}${path}` : '');
  const ogUrl = og.url || `${baseUrl}${path}`;
  const ogSiteName = og.site_name || settings.siteName;

  // Compute alternate language URLs using next-i18next and current path
  const pathWithoutLocale = path.replace(new RegExp(`^/${router.locale}`), '') || '/';
  const stripPath = pathWithoutLocale === '/' ? '' : pathWithoutLocale;
  const alternates = (router.locales || i18n?.options?.locales || []).map((lng) => {
    const localePath = lng === router.defaultLocale ? stripPath : `/${lng}${stripPath}`;
    return { hrefLang: lng, href: `${baseUrl}${localePath || '/'}` };
  });
  const defaultAlternate = alternates.find((a) => a.hrefLang === router.defaultLocale);

  const robots = settings.globalSEO?.noindexSitewide || meta.noindex || meta.nofollow
    ? `${settings.globalSEO?.noindexSitewide || meta.noindex ? 'noindex' : 'index'},${meta.nofollow ? 'nofollow' : 'follow'}`
    : null;

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
        .filter(([k]) => !["url", "site_name"].includes(k))
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
