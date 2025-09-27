import { useEffect, useMemo, useState } from 'react';
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

  const persist = useMemo(() => useSEOConfigStore.persist, []);
  const [hydrated, setHydrated] = useState(() => persist?.hasHydrated?.() ?? !persist);

  useEffect(() => {
    if (!persist) {
      return;
    }

    if (hydrated) return;

    if (persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }

    const unsub = persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });

    return () => {
      unsub?.();
    };
  }, [hydrated, persist]);

  const [resolvedOrigin, setResolvedOrigin] = useState(
    () => settings.baseUrl || process.env.NEXT_PUBLIC_SITE_URL || ''
  );

  useEffect(() => {
    if (!hydrated || loaded) return;
    fetchConfig();
  }, [hydrated, loaded, fetchConfig]);

  useEffect(() => {
    if (!resolvedOrigin && typeof window !== 'undefined') {
      setResolvedOrigin(window.location.origin);
    }
  }, [resolvedOrigin]);

  const effectiveSettings = hydrated ? settings : {};

  const meta = effectiveSettings.metaTags?.[path] || {};
  const og = effectiveSettings.openGraph?.[path] || {};
  const twitter = effectiveSettings.twitter?.[path] || {};
  const twitterImage = twitter.image || og.image;

  const baseUrl = effectiveSettings.baseUrl || resolvedOrigin;
  const canonical = meta.canonical || (effectiveSettings.globalSEO?.forceCanonical ? `${baseUrl}${path}` : '');
  const ogUrl = og.url || `${baseUrl}${path}`;
  const ogSiteName = og.site_name || effectiveSettings.siteName;

  // Compute alternate language URLs using next-i18next and current path
  const pathWithoutLocale = path.replace(new RegExp(`^/${router.locale}`), '') || '/';
  const stripPath = pathWithoutLocale === '/' ? '' : pathWithoutLocale;
  const alternates = (router.locales || i18n?.options?.locales || []).map((lng) => {
    const localePath = lng === router.defaultLocale ? stripPath : `/${lng}${stripPath}`;
    return { hrefLang: lng, href: `${baseUrl}${localePath || '/'}` };
  });
  const defaultAlternate = alternates.find((a) => a.hrefLang === router.defaultLocale);

  const robotsBase = effectiveSettings.globalSEO?.noindexSitewide || meta.noindex;
  const robotsFollow = meta.nofollow;
  const robots = robotsBase || robotsFollow
    ? `${robotsBase ? 'noindex' : 'index'},${robotsFollow ? 'nofollow' : 'follow'}`
    : null;

  let sanitizedJsonSchema;
  if (effectiveSettings.jsonSchema) {
    try {
      const parsed = JSON.parse(effectiveSettings.jsonSchema);
      if (parsed && typeof parsed === 'object') {
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
