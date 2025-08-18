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

  const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const baseUrl = settings.baseUrl || fallbackUrl;
  const canonical = meta.canonical || (settings.globalSEO?.forceCanonical ? `${baseUrl}${path}` : '');

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
      {Object.entries(og).map(([k, v]) => v ? <meta key={`og-${k}`} property={`og:${k}`} content={v} /> : null)}
      {twitter.cardType && <meta name="twitter:card" content={twitter.cardType} />}
      {twitter.title && <meta name="twitter:title" content={twitter.title} />}
      {twitter.description && <meta name="twitter:description" content={twitter.description} />}
      {twitter.image && <meta name="twitter:image" content={twitter.image} />}
      {twitter.handle && <meta name="twitter:site" content={twitter.handle} />}
      {settings.jsonSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: settings.jsonSchema }} />
      )}
    </Head>
  );
}
