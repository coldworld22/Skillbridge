import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import useSEOConfigStore from '@/store/seoConfigStore';

export default function SeoTags() {
  const router = useRouter();
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
  const ogUrl = og.url || `${baseUrl}${path}`;
  const ogSiteName = og.site_name || settings.siteName;

  const robots = settings.globalSEO?.noindexSitewide || meta.noindex || meta.nofollow
    ? `${settings.globalSEO?.noindexSitewide || meta.noindex ? 'noindex' : 'index'},${meta.nofollow ? 'nofollow' : 'follow'}`
    : null;

  return (
    <Head>
      {meta.title && <title>{meta.title}</title>}
      {meta.description && <meta name="description" content={meta.description} />}
      {meta.keywords && <meta name="keywords" content={meta.keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {robots && <meta name="robots" content={robots} />}
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      {ogSiteName && <meta property="og:site_name" content={ogSiteName} />}
      {Object.entries(og)
        .filter(([k]) => !["url", "site_name"].includes(k))
        .map(([k, v]) => (v ? <meta key={`og-${k}`} property={`og:${k}`} content={v} /> : null))}
      {twitter.cardType && <meta name="twitter:card" content={twitter.cardType} />}
      {twitter.title && <meta name="twitter:title" content={twitter.title} />}
      {twitter.description && <meta name="twitter:description" content={twitter.description} />}
      {twitter.image && <meta name="twitter:image" content={twitter.image} />}
      {twitter.handle && <meta name="twitter:site" content={twitter.handle} />}
      {twitter.handle && <meta name="twitter:creator" content={twitter.handle} />}
      {settings.jsonSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: settings.jsonSchema }} />
      )}
    </Head>
  );
}
