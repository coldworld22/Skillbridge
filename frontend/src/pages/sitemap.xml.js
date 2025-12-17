import { resolveApiBase, resolveSiteUrl } from "@/utils/serverApi";

const buildSitemap = (siteUrl, pages = []) => {
  const base = (siteUrl || "").replace(/\/$/, "");
  const urlset = pages
    .filter((p) => p?.path && p.include !== false)
    .map((p) => {
      const loc = `${base}${p.path}`;
      const changefreq = p.freq || "weekly";
      const priority = typeof p.priority === "number" ? p.priority : 0.5;
      return `  <url><loc>${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>`;
};

export default function SitemapXML() {
  return null;
}

export const getServerSideProps = async ({ res }) => {
  const apiBase = resolveApiBase(false).replace(/\/$/, "");
  const uploadsBase = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  const siteUrl = resolveSiteUrl(false) || uploadsBase;

  let xml = null;

  const tryFetch = async () => {
    try {
      const response = await fetch(`${uploadsBase}/uploads/seo/sitemap.xml`);
      if (response.ok) {
        xml = await response.text();
      }
    } catch (err) {
      console.warn("Unable to fetch generated sitemap.xml from backend", err);
    }
  };

  await tryFetch();

  if (!xml) {
    try {
      const response = await fetch(`${apiBase}/seo-config`, { headers: { Accept: "application/json" } });
      if (response.ok) {
        const json = await response.json();
        const settings = json?.data ?? json ?? {};
        xml = buildSitemap(siteUrl, settings.sitemap || []);
      }
    } catch (err) {
      console.warn("Unable to build fallback sitemap.xml", err);
    }
  }

  if (!xml) {
    xml = buildSitemap(siteUrl, []);
  }

  res.setHeader("Content-Type", "application/xml");
  res.write(xml);
  res.end();

  return { props: {} };
};
