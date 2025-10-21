import { resolveApiBase, resolveSiteUrl } from "@/utils/serverApi";

const DEFAULT_ROBOTS = (siteUrl) => `User-agent: *
Disallow: /dashboard/
Disallow: /admin/
Disallow: /auth/
Allow: /

Sitemap: ${siteUrl ? `${siteUrl.replace(/\/$/, "")}/sitemap.xml` : "/sitemap.xml"}`;

export default function RobotsTxt() {
  return null;
}

export const getServerSideProps = async ({ res, req }) => {
  const apiBase = resolveApiBase(false);
  const siteUrl =
    resolveSiteUrl(false) ||
    (req?.headers?.host
      ? `${(req.headers["x-forwarded-proto"] || "https")}://${req.headers.host}`
      : "");

  let robots = DEFAULT_ROBOTS(siteUrl);

  try {
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/seo-config`, {
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const json = await response.json();
      const settings = json?.data ?? json ?? {};
      if (settings?.robots) {
        robots = settings.robots;
      }
    }
  } catch (err) {
    console.warn("Unable to fetch robots.txt from backend", err);
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.write(robots);
  res.end();

  return { props: {} };
};
