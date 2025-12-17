const logger = require('../../utils/logger.js');
const { readJsonSetting, writeJsonSetting } = require("../../utils/settingsStore");

const SETTINGS_KEY = "seo_settings";

const DEFAULT_GLOBAL_SEO = {
  forceCanonical: true,
  noindexSitewide: false,
  nofollowSitewide: false,
  autoPingSitemap: true,
};

exports.getSettings = async () => {
  const base = process.env.FRONTEND_URL || "http://localhost:3000";
  const stored = (await readJsonSetting(SETTINGS_KEY)) || {};
  const data = { ...stored };
  if (!data.baseUrl) data.baseUrl = base;
  if (data.siteName === undefined || data.siteName === null) {
    data.siteName = "";
  }
  return data;
};

exports.updateSettings = async (settings) => {
  if (!settings.baseUrl) {
    settings.baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  }
  if (settings.siteName === undefined) {
    settings.siteName = "";
  }
  await writeJsonSetting(SETTINGS_KEY, settings);

  // Also write robots.txt if robots content is provided
  try {
    const fs = require("fs");
    const path = require("path");
    const frontendPublic = path.join(__dirname, "../../../../frontend/public");
    if (fs.existsSync(frontendPublic)) {
      const robotsPath = path.join(frontendPublic, "robots.txt");
      if (settings.robots) {
        fs.writeFileSync(robotsPath, settings.robots);
      } else if (fs.existsSync(robotsPath)) {
        fs.unlinkSync(robotsPath);
      }
    } else {
      logger.warn("Skipping robots.txt write – frontend/public directory not found in backend container.");
    }
  } catch (err) {
    logger.error("Failed to write robots.txt", err);
  }

  return settings;
};

// Generate sitemap.xml file based on saved sitemap config
exports.generateSitemap = async () => {
  const fs = require("fs");
  const path = require("path");
  const fetch = (...args) =>
    import("node-fetch").then(({ default: fetchFn }) => fetchFn(...args));
  const { frontendBase } = require("../../utils/frontend");

  const settings = (await exports.getSettings()) || {};
  const pages = settings.sitemap || [];
  const baseUrl = settings.baseUrl || process.env.FRONTEND_URL || "https://example.com";

  const urlset = pages
    .filter((p) => p.include)
    .map(
      (p) =>
        `  <url><loc>${baseUrl.replace(/\/$/, "")}${p.path}</loc><changefreq>${p.freq || "weekly"}</changefreq><priority>${p.priority || 0.5}</priority></url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>`;

  const dir = path.join(__dirname, "../../../uploads/seo");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "sitemap.xml");
  fs.writeFileSync(filePath, xml);

  const updated = new Date().toISOString();
  settings.sitemapUpdated = updated;
  await exports.updateSettings(settings);

  if (settings.globalSEO?.autoPingSitemap) {
    const sitemapUrl = `${frontendBase}/uploads/seo/sitemap.xml`;
    const endpoints = [
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    ];
    for (const url of endpoints) {
      try {
        await fetch(url);
      } catch (err) {
        logger.error("Failed to ping", url, err);
      }
    }
  }

  return { url: "/uploads/seo/sitemap.xml", updated };
};

// Scan saved meta tags for common issues
exports.scanMetaIssues = async () => {
  const settings = (await exports.getSettings()) || {};
  const meta = settings.metaTags || {};
  const openGraph = settings.openGraph || {};
  const issues = [];
  const duplicates = [];
  const titleMap = {};
  const descMap = {};
  Object.entries(meta).forEach(([path, data]) => {
    const missing = [];
    if (!data.title) missing.push("title");
    if (!data.description) missing.push("description");

    const og = openGraph[path] || {};
    if (Object.keys(openGraph).length) {
      if (!og.title) missing.push("og:title");
      if (!og.description) missing.push("og:description");
      if (!og.image) missing.push("og:image");
    }

    if (data.title) {
      if (titleMap[data.title]) {
        duplicates.push({ field: "title", paths: [titleMap[data.title], path] });
      } else {
        titleMap[data.title] = path;
      }
    }
    if (data.description) {
      if (descMap[data.description]) {
        duplicates.push({ field: "description", paths: [descMap[data.description], path] });
      } else {
        descMap[data.description] = path;
      }
    }

    if (missing.length) issues.push({ path, missing });
  });

  const stats = {
    indexedPages: (settings.sitemap || []).filter((p) => p.include).length,
    pagesMissingMeta: issues.length,
    sitemapUpdated: settings.sitemapUpdated || null,
    robotsStatus: settings.robots ? "Active" : "Empty",
    openGraphReady: settings.openGraph ? Object.keys(settings.openGraph).length : 0,
  };

  const scannedAt = new Date().toISOString();
  stats.lastChecked = scannedAt;

  settings.stats = stats;
  settings.lastChecked = scannedAt;
  await exports.updateSettings(settings);

  return { stats, issues, duplicates, scannedAt };
};

// Recursively scan the Next.js pages directory to collect available routes
exports.listPages = async () => {
  const fs = require("fs");
  const path = require("path");

  const rootDir = path.join(__dirname, "../../../..");
  const pagesDir = path.join(rootDir, "frontend", "src", "pages");
  const pages = new Set();

  const walk = (dir, base = "") => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith("_")) continue;
      const full = path.join(dir, entry.name);
      const relBase = path.join(base, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "api") continue;
        walk(full, relBase);
      } else if (entry.isFile()) {
        if (!/\.(js|jsx|ts|tsx)$/.test(entry.name)) continue;
        if (entry.name.startsWith("[")) continue;
        if (/^index\.(js|jsx|ts|tsx)$/.test(entry.name)) {
          const p = base ? `/${base.replace(/\\/g, "/")}` : "/";
          pages.add(p);
        } else {
          const name = entry.name.replace(/\.(js|jsx|ts|tsx)$/, "");
          const p = `/${path.join(base, name).replace(/\\/g, "/")}`;
          pages.add(p);
        }
      }
    }
  };

  walk(pagesDir, "");
  return Array.from(pages).sort();
};
