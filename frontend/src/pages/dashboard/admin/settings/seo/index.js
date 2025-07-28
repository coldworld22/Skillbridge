// pages/dashboard/admin/settings/seo/index.js
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { updateSEOConfig } from "@/services/admin/seoConfigService";
import { Tab } from "@headlessui/react";
import { FaTags, FaSitemap, FaRobot, FaCog, FaTwitter, FaGlobe, FaEdit } from "react-icons/fa";
import useSEOConfigStore from "@/store/seoConfigStore";

const defaultConfig = {
  metaTags: {},
  sitemap: [],
  robots: "",
  openGraph: {},
  twitter: {},
  globalSEO: {
    forceCanonical: true,
    noindexSitewide: false,
    autoPingSitemap: true,
  },
  redirects: [],
  jsonSchema: "",
};

// Collect unique page paths from existing config sections
function collectPages(cfg) {
  const pages = new Set(["/"]);
  if (Array.isArray(cfg?.sitemap)) {
    cfg.sitemap.forEach((p) => p.path && pages.add(p.path));
  }
  [cfg?.metaTags, cfg?.openGraph, cfg?.twitter].forEach((section) => {
    if (section) Object.keys(section).forEach((p) => pages.add(p));
  });
  return Array.from(pages).sort();
}

const tabs = [
  { key: "overview", label: "Overview", icon: <FaGlobe /> },
  { key: "meta", label: "Meta Tags", icon: <FaTags /> },
  { key: "sitemap", label: "Sitemap", icon: <FaSitemap /> },
  { key: "robots", label: "Robots.txt", icon: <FaRobot /> },
  { key: "og", label: "Open Graph", icon: <FaEdit /> },
  { key: "twitter", label: "Twitter Cards", icon: <FaTwitter /> },
  { key: "advanced", label: "Advanced", icon: <FaCog /> },
];

export default function SEOSettingsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const fetchConfig = useSEOConfigStore((state) => state.fetch);
  const seoConfig = useSEOConfigStore((state) => state.settings);
  const updateStore = useSEOConfigStore((state) => state.update);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const config = { ...defaultConfig, ...seoConfig };

  return (
    <AdminLayout title="SEO Settings">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">SEO Control Panel</h1>
        <p className="text-gray-600">Manage meta data, sitemap, and indexing rules.</p>
      </div>

      <Tab.Group selectedIndex={tabs.findIndex(t => t.key === activeTab)} onChange={(i) => setActiveTab(tabs[i].key)}>
        <Tab.List className="flex gap-4 mb-4">
          {tabs.map((tab) => (
            <Tab key={tab.key} className={({ selected }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium 
              ${selected ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"}`
            }>
              {tab.icon} {tab.label}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="bg-white p-6 rounded-md shadow">
          <Tab.Panel>
          <SEOOverview config={config} onChangeTab={setActiveTab} />
          </Tab.Panel>
          <Tab.Panel>
            <MetaTagsManager config={config} update={updateStore} />
          </Tab.Panel>
          <Tab.Panel>
            <SitemapManager config={config} update={updateStore} />
          </Tab.Panel>
          <Tab.Panel>
            <RobotsEditor config={config} update={updateStore} />
          </Tab.Panel>
          <Tab.Panel>
            <OpenGraphSettings config={config} update={updateStore} />
          </Tab.Panel>
          <Tab.Panel>
            <TwitterCardSettings config={config} update={updateStore} />
          </Tab.Panel>
          <Tab.Panel>
            <AdvancedSEOSettings config={config} update={updateStore} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </AdminLayout>
  );
}

function SEOOverview({ config, onChangeTab }) {
  const regenerate = useSEOConfigStore((s) => s.regenerate);
  const scan = useSEOConfigStore((s) => s.scan);

  const stats = config.stats
    ? [
        { label: "Indexed Pages", value: config.stats.indexedPages, icon: "🧭" },
        { label: "Pages Missing Meta Tags", value: config.stats.pagesMissingMeta, icon: "⚠️" },
        { label: "Sitemap Last Updated", value: config.stats.sitemapUpdated || "-", icon: "📆" },
        { label: "Robots.txt Status", value: config.stats.robotsStatus, icon: "🤖" },
        { label: "Open Graph Ready Pages", value: config.stats.openGraphReady, icon: "📸" },
      ]
    : [];

  const actions = [
    {
      label: "Regenerate Sitemap",
      icon: "🔁",
      onClick: async () => {
        try {
          await regenerate();
          toast.success("Sitemap regenerated");
        } catch {
          toast.error("Failed to regenerate");
        }
      },
    },
    {
      label: "Edit Robots.txt",
      icon: "✏️",
      onClick: () => onChangeTab("robots"),
    },
    {
      label: "Scan for Meta Issues",
      icon: "🕵️",
      onClick: async () => {
        try {
          const res = await scan();
          toast.info(`${res.issues.length} issues found`);
        } catch {
          toast.error("Failed to scan");
        }
      },
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-800">📊 SEO Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-gray-50 border rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-sm text-gray-600">{s.label}</div>
              <div className="text-xl font-bold text-yellow-600">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-800">⚡ Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md shadow"
            >
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


function MetaTagsManager({ config, update: updateConfig }) {
  const pages = useMemo(() => collectPages(config), [config]);
  const [selectedPage, setSelectedPage] = useState(pages[0] || "/");
  const [form, setForm] = useState({
    title: "",
    description: "",
    keywords: "",
    canonical: "",
    noindex: false,
    nofollow: false,
  });

  useEffect(() => {
    if (!pages.includes(selectedPage)) setSelectedPage(pages[0] || "/");
  }, [pages, selectedPage]);

  useEffect(() => {
    const meta = config.metaTags?.[selectedPage] || {};
    setForm((prev) => ({ ...prev, ...meta }));
  }, [selectedPage, config.metaTags]);


  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const updated = {
      ...config,
      metaTags: { ...config.metaTags, [selectedPage]: form },
    };
    updateConfig(updated);
    try {
      await updateSEOConfig(updated);
      toast.success("Meta tags saved");
    } catch (_err) {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">📝 Edit Meta Tags</h2>

      {/* Page Selector */}
      <div className="flex flex-col md:flex-row items-start gap-4">
        <label className="font-medium">Select Page:</label>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-1/2"
        >
          {pages.map((page, i) => (
            <option key={i} value={page}>{page}</option>
          ))}
        </select>
      </div>

      {/* Editable Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block font-medium mb-1">Meta Title</label>
          <input
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Enter SEO title..."
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Meta Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Short description for search engines..."
            rows={3}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Keywords</label>
          <input
            value={form.keywords}
            onChange={(e) => handleChange("keywords", e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Comma-separated keywords"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Canonical URL</label>
          <input
            value={form.canonical}
            onChange={(e) => handleChange("canonical", e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="https://yourdomain.com/page"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-6 items-center mt-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.noindex}
            onChange={() => handleChange("noindex", !form.noindex)}
          />
          Noindex
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.nofollow}
            onChange={() => handleChange("nofollow", !form.nofollow)}
          />
          Nofollow
        </label>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md"
      >
        💾 Save Meta Tags
      </button>
    </div>
  );
}

function SitemapManager({ config, update }) {
  const [pages, setPages] = useState(config.sitemap.length ? config.sitemap : [
    { path: "/", include: true, priority: 1.0, freq: "daily" },
  ]);

  const changeFreqOptions = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

  const updatePage = (index, key, value) => {
    const updated = [...pages];
    updated[index][key] = value;
    setPages(updated);
  };

  const regenerateSitemap = async () => {
    const updated = { ...config, sitemap: pages };
    update(updated);
    try {
      await updateSEOConfig(updated);
      toast.success("Sitemap saved");
    } catch (_err) {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">📄 Sitemap Manager</h2>
        <button
          onClick={regenerateSitemap}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded shadow"
        >
          🔁 Regenerate Sitemap
        </button>
      </div>

      <table className="w-full table-auto border text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="p-2 text-left">Path</th>
            <th className="p-2">Include</th>
            <th className="p-2">Priority</th>
            <th className="p-2">Change Freq</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page, index) => (
            <tr key={index} className="border-t">
              <td className="p-2">{page.path}</td>
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={page.include}
                  onChange={(e) => updatePage(index, "include", e.target.checked)}
                />
              </td>
              <td className="p-2 text-center">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1.0"
                  value={page.priority}
                  onChange={(e) => updatePage(index, "priority", parseFloat(e.target.value))}
                  className="w-16 text-center border rounded px-1 py-0.5"
                />
              </td>
              <td className="p-2 text-center">
                <select
                  value={page.freq}
                  onChange={(e) => updatePage(index, "freq", e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  {changeFreqOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {config.sitemapUpdated && (
        <div className="text-sm text-gray-500 italic">
          Last updated: {config.sitemapUpdated}
        </div>
      )}
    </div>
  );
}


function RobotsEditor({ config, update }) {
  const defaultContent = `
User-agent: *
Disallow: /dashboard/
Disallow: /admin/
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
  `.trim();

  const [content, setContent] = useState(config.robots || defaultContent);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const updated = { ...config, robots: content };
    update(updated);
    try {
      await updateSEOConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_err) {
      toast.error("Failed to save");
    }
  };

  const restoreDefault = () => {
    setContent(defaultContent);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">🤖 Robots.txt Editor</h2>

      <p className="text-sm text-gray-600">
        Search engines use robots.txt to know what they can or cannot index.
        You can preview it at: <code className="text-yellow-600">https://yourdomain.com/robots.txt</code>
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        className="w-full border rounded px-4 py-3 font-mono text-sm bg-gray-50"
      />

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded shadow"
        >
          💾 Save
        </button>

        <button
          onClick={restoreDefault}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded"
        >
          🔄 Restore Default
        </button>
      </div>

      {saved && <p className="text-green-600 text-sm">✅ Saved successfully</p>}
    </div>
  );
}


function OpenGraphSettings({ config, update }) {
  const pages = useMemo(() => collectPages(config), [config]);
  const [selectedPage, setSelectedPage] = useState(pages[0] || "/");
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "website",
    image: "",
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    handleChange("image", url);
  };

  useEffect(() => {
    if (!pages.includes(selectedPage)) setSelectedPage(pages[0] || "/");
  }, [pages, selectedPage]);

  useEffect(() => {
    const data = config.openGraph?.[selectedPage] || {};
    setForm((prev) => ({ ...prev, ...data }));
  }, [selectedPage, config.openGraph]);

  const handleSave = async () => {
    const updated = {
      ...config,
      openGraph: { ...config.openGraph, [selectedPage]: form },
    };
    update(updated);
    try {
      await updateSEOConfig(updated);
      toast.success("Open Graph saved");
    } catch (_err) {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">📸 Open Graph Settings</h2>

      {/* Page Selector */}
      <div>
        <label className="block font-medium mb-1">Select Page</label>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-1/2"
        >
          {pages.map((page, i) => (
            <option key={i} value={page}>{page}</option>
          ))}
        </select>
      </div>

      {/* Title, Description */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block font-medium mb-1">OG Title</label>
          <input
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Open Graph title"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">OG Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Description for social sharing"
            rows={3}
          />
        </div>
      </div>

      {/* Type + Image Upload */}
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <label className="block font-medium mb-1">OG Type</label>
          <select
            value={form.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          >
            {["website", "article", "product", "video", "book"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">OG Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {form.image && (
            <img src={form.image} alt="OG Preview" className="mt-2 w-48 rounded shadow" />
          )}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded"
      >
        💾 Save OG Settings
      </button>
    </div>
  );
}

function TwitterCardSettings({ config, update }) {
  const pages = useMemo(() => collectPages(config), [config]);
  const [selectedPage, setSelectedPage] = useState(pages[0] || "/");
  const [form, setForm] = useState({
    title: "",
    description: "",
    cardType: "summary",
    image: "",
    handle: "@yourhandle"
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    handleChange("image", url);
  };

  useEffect(() => {
    if (!pages.includes(selectedPage)) setSelectedPage(pages[0] || "/");
  }, [pages, selectedPage]);

  useEffect(() => {
    const data = config.twitter?.[selectedPage] || {};
    setForm((prev) => ({ ...prev, ...data }));
  }, [selectedPage, config.twitter]);

  const handleSave = async () => {
    const updated = {
      ...config,
      twitter: { ...config.twitter, [selectedPage]: form },
    };
    update(updated);
    try {
      await updateSEOConfig(updated);
      toast.success("Twitter card saved");
    } catch (_err) {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">🐦 Twitter Card Settings</h2>

      {/* Page Selector */}
      <div>
        <label className="block font-medium mb-1">Select Page</label>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-1/2"
        >
          {pages.map((page, i) => (
            <option key={i} value={page}>{page}</option>
          ))}
        </select>
      </div>

      {/* Title + Description */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block font-medium mb-1">Twitter Title</label>
          <input
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Twitter card title"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Twitter Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Short description for Twitter"
            rows={3}
          />
        </div>
      </div>

      {/* Type + Image + Handle */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block font-medium mb-1">Card Type</label>
          <select
            value={form.cardType}
            onChange={(e) => handleChange("cardType", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="summary">Summary (small image)</option>
            <option value="summary_large_image">Large Image</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Twitter Handle (optional)</label>
          <input
            value={form.handle}
            onChange={(e) => handleChange("handle", e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="@username"
          />
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block font-medium mb-1">Twitter Card Image</label>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {form.image && (
          <img src={form.image} alt="Twitter Preview" className="mt-2 w-48 rounded shadow" />
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded"
      >
        💾 Save Twitter Card
      </button>
    </div>
  );
}


function AdvancedSEOSettings({ config, update }) {
  const [globalSEO, setGlobalSEO] = useState({
    forceCanonical: true,
    noindexSitewide: false,
    autoPingSitemap: true,
  });

  const [redirects, setRedirects] = useState([
    { from: "/old-page", to: "/new-page", code: 301 },
  ]);

  const [jsonSchema, setJsonSchema] = useState(`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SkillBridge",
  "url": "https://yourdomain.com"
}`);

  const handleGlobalChange = (key, value) => {
    setGlobalSEO((prev) => ({ ...prev, [key]: value }));
  };

  const handleRedirectChange = (i, key, value) => {
    const updated = [...redirects];
    updated[i][key] = value;
    setRedirects(updated);
  };

  const addRedirect = () => {
    setRedirects([...redirects, { from: "", to: "", code: 301 }]);
  };

  const deleteRedirect = (i) => {
    const updated = redirects.filter((_, idx) => idx !== i);
    setRedirects(updated);
  };

  useEffect(() => {
    if (config.globalSEO) setGlobalSEO({ ...globalSEO, ...config.globalSEO });
    if (config.redirects) setRedirects(config.redirects);
    if (config.jsonSchema) setJsonSchema(config.jsonSchema);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const handleSave = async () => {
    const updated = { ...config, globalSEO, redirects, jsonSchema };
    update(updated);
    try {
      await updateSEOConfig(updated);
      toast.success("SEO settings saved!");
    } catch (err) {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="space-y-10">
      {/* GLOBAL SEO CONTROLS */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Global SEO Settings</h2>
        <div className="space-y-3">
          {Object.entries(globalSEO).map(([key, val]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={val}
                onChange={() => handleGlobalChange(key, !val)}
              />
              {key === "forceCanonical" && "Force Canonical URLs Sitewide"}
              {key === "noindexSitewide" && "Apply noindex tag to entire site"}
              {key === "autoPingSitemap" && "Auto-notify search engines on sitemap update"}
            </label>
          ))}
        </div>
      </div>

      {/* REDIRECTS */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🔀 Redirect Rules</h2>
        <table className="w-full table-auto border text-sm mb-2">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2">From</th>
              <th className="p-2">To</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {redirects.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={r.from}
                    onChange={(e) => handleRedirectChange(i, "from", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={r.to}
                    onChange={(e) => handleRedirectChange(i, "to", e.target.value)}
                  />
                </td>
                <td className="p-2 text-center">
                  <select
                    value={r.code}
                    onChange={(e) => handleRedirectChange(i, "code", parseInt(e.target.value))}
                    className="border rounded px-2 py-1"
                  >
                    <option value={301}>301</option>
                    <option value={302}>302</option>
                  </select>
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => deleteRedirect(i)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={addRedirect}
          className="text-yellow-600 hover:underline text-sm"
        >
          ➕ Add Redirect
        </button>
      </div>

      {/* JSON-LD SCHEMA */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🧠 Structured Data (JSON-LD)</h2>
        <textarea
          value={jsonSchema}
          onChange={(e) => setJsonSchema(e.target.value)}
          rows={10}
          className="w-full font-mono text-sm border rounded px-3 py-2 bg-gray-50"
        />
        <p className="text-gray-500 text-xs mt-1">⚠️ Ensure valid JSON format. Apply this globally or by route using backend rules.</p>
      </div>

      {/* SAVE BUTTONS */}
      <div>
        <button
          onClick={handleSave}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded shadow"
        >
          💾 Save All Advanced Settings
        </button>
      </div>
    </div>
  );
}
