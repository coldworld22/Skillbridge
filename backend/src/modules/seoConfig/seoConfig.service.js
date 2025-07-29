const db = require("../../config/database");

const SETTINGS_KEY = "seo_settings";

exports.getSettings = async () => {
  const row = await db("settings").where({ key: SETTINGS_KEY }).first();
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch (_err) {
    return null;
  }
};

exports.updateSettings = async (settings) => {
  const value = JSON.stringify(settings);
  const existing = await db("settings").where({ key: SETTINGS_KEY }).first();
  if (existing) {
    await db("settings")
      .where({ key: SETTINGS_KEY })
      .update({ value, updated_at: db.fn.now() });
  } else {
    await db("settings").insert({ key: SETTINGS_KEY, value });
  }

  // Also write robots.txt if robots content is provided
  try {
    const fs = require("fs");
    const path = require("path");
    const robotsPath = path.join(__dirname, "../../../../frontend/public/robots.txt");
    if (settings.robots) {
      fs.writeFileSync(robotsPath, settings.robots);
    } else if (fs.existsSync(robotsPath)) {
      fs.unlinkSync(robotsPath);
    }
  } catch (err) {
    console.error("Failed to write robots.txt", err);
  }

  return settings;
};

// Generate sitemap.xml file based on saved sitemap config
exports.generateSitemap = async () => {
  const fs = require("fs");
  const path = require("path");

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

  return { url: "/uploads/seo/sitemap.xml", updated };
};

// Scan saved meta tags for missing title or description
exports.scanMetaIssues = async () => {
  const settings = (await exports.getSettings()) || {};
  const meta = settings.metaTags || {};
  const issues = [];
  Object.entries(meta).forEach(([path, data]) => {
    const missing = [];
    if (!data.title) missing.push("title");
    if (!data.description) missing.push("description");
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

  return { stats, issues, scannedAt };
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
