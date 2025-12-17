// pages/dashboard/admin/settings/seo/index.js
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import {
  FaTags,
  FaSitemap,
  FaRobot,
  FaCog,
  FaTwitter,
  FaGlobe,
  FaEdit,
} from "react-icons/fa";
import { useTranslation } from "next-i18next";
import useSEOConfigStore from "@/store/seoConfigStore";
import SEOOverview from "@/components/admin/settings/seo/SEOOverview";
import MetaTagsManager from "@/components/admin/settings/seo/MetaTagsManager";
import SitemapManager from "@/components/admin/settings/seo/SitemapManager";
import RobotsEditor from "@/components/admin/settings/seo/RobotsEditor";
import OpenGraphSettings from "@/components/admin/settings/seo/OpenGraphSettings";
import TwitterCardSettings from "@/components/admin/settings/seo/TwitterCardSettings";
import AdvancedSEOSettings from "@/components/admin/settings/seo/AdvancedSEOSettings";
import styles from "../settings.module.scss";

const defaultConfig = {
  metaTags: {},
  sitemap: [],
  robots: "",
  openGraph: {},
  twitter: {},
  siteName: "",
  globalSEO: {
    forceCanonical: true,
    noindexSitewide: false,
    autoPingSitemap: true,
  },
  redirects: [],
  jsonSchema: "",
};

export default function SEOSettingsPage() {
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: "seoPage" });
  const tabs = [
    { key: "overview", label: t("tabs.overview"), icon: <FaGlobe /> },
    { key: "meta", label: t("tabs.meta"), icon: <FaTags /> },
    { key: "sitemap", label: t("tabs.sitemap"), icon: <FaSitemap /> },
    { key: "robots", label: t("tabs.robots"), icon: <FaRobot /> },
    { key: "og", label: t("tabs.og"), icon: <FaEdit /> },
    { key: "twitter", label: t("tabs.twitter"), icon: <FaTwitter /> },
    { key: "advanced", label: t("tabs.advanced"), icon: <FaCog /> },
  ];

  const [activeTab, setActiveTab] = useState("overview");
  const fetchConfig = useSEOConfigStore((state) => state.fetch);
  const seoConfig = useSEOConfigStore((state) => state.settings);
  const updateStore = useSEOConfigStore((state) => state.update);
  const fetchPages = useSEOConfigStore((s) => s.fetchPages);
  const pageList = useSEOConfigStore((s) => s.pages);

  useEffect(() => {
    fetchConfig();
    fetchPages();
  }, [fetchConfig, fetchPages]);

  const config = { ...defaultConfig, ...seoConfig };

  return (
    <AdminLayout title={t("title")}>
      <div className={styles.page} dir={i18n.dir()}>
        <div className={styles.sectionHeader}>
          <div>
            <h1 className={styles.title}>{t("title")}</h1>
            <p className={styles.subtitle}>{t("description")}</p>
          </div>
        </div>

        <Tab.Group selectedIndex={tabs.findIndex((t) => t.key === activeTab)} onChange={(i) => setActiveTab(tabs[i].key)}>
          <Tab.List className={styles.tabs}>
            {tabs.map((tab) => (
              <Tab
                key={tab.key}
                className={({ selected }) =>
                  `${styles.tab} ${selected ? styles.tabActive : ""}`
                }
              >
                {tab.icon} {tab.label}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className={styles.card}>
            <Tab.Panel>
              <SEOOverview config={config} onChangeTab={setActiveTab} />
            </Tab.Panel>
            <Tab.Panel>
              <MetaTagsManager config={config} update={updateStore} availablePages={pageList} />
            </Tab.Panel>
            <Tab.Panel>
              <SitemapManager config={config} update={updateStore} availablePages={pageList} />
            </Tab.Panel>
            <Tab.Panel>
              <RobotsEditor config={config} update={updateStore} />
            </Tab.Panel>
            <Tab.Panel>
              <OpenGraphSettings config={config} update={updateStore} availablePages={pageList} />
            </Tab.Panel>
            <Tab.Panel>
              <TwitterCardSettings config={config} update={updateStore} availablePages={pageList} />
            </Tab.Panel>
            <Tab.Panel>
              <AdvancedSEOSettings config={config} update={updateStore} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </AdminLayout>
  );
}
