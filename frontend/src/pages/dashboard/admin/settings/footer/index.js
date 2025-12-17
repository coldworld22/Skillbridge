import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaPlus, FaTrash } from "react-icons/fa";
import { fetchAppConfig, updateAppConfig } from "@/services/admin/appConfigService";
import useAppConfigStore from "@/store/appConfigStore";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import styles from "../settings.module.scss";

const defaultFooter = {
  about: "SkillBridge connects learners with expert instructors worldwide.",
  socialLinks: [
    { platform: "Facebook", url: "https://facebook.com" },
    { platform: "Twitter", url: "https://twitter.com" },
  ],
  quickLinks: ["about", "contact", "FAQs", "Blog", "Support"],
  sitemap: ["Courses", "Instructors", "Community", "Careers"],
  contact: {
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Learning St, New York, USA",
  },
  whatsapp: "15551234567",
  showNewsletter: true,
  footerNote: "All rights reserved.",
  adsEnabled: false,
  adsClientId: "ca-pub-xxxxxxxxxxxxxxxx",
  paymentMethods: {
    visa: true,
    mastercard: true,
    paypal: true,
    applepay: true,
    amazonpay: false,
  },
};

export default function FooterSettingsPage() {
  const updateStore = useAppConfigStore((state) => state.update);
  const fetchConfig = useAppConfigStore((state) => state.fetch);
  const [config, setConfig] = useState({});
  const [about, setAbout] = useState(defaultFooter.about);
  const [socialLinks, setSocialLinks] = useState(defaultFooter.socialLinks);
  const [quickLinks, setQuickLinks] = useState(defaultFooter.quickLinks);
  const [sitemap, setSitemap] = useState(defaultFooter.sitemap);
  const [contact, setContact] = useState(defaultFooter.contact);
  const [whatsapp, setWhatsapp] = useState(defaultFooter.whatsapp);
  const [showNewsletter, setShowNewsletter] = useState(defaultFooter.showNewsletter);
  const [footerNote, setFooterNote] = useState(defaultFooter.footerNote);
  const [adsEnabled, setAdsEnabled] = useState(defaultFooter.adsEnabled);
  const [adsClientId, setAdsClientId] = useState(defaultFooter.adsClientId);
  const [paymentMethods, setPaymentMethods] = useState(defaultFooter.paymentMethods);
  const { t } = useTranslation('dashboard', { keyPrefix: 'footerPage' });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAppConfig();
        setConfig(data);
        const footer = data.footer || {};
        setAbout(footer.about ?? defaultFooter.about);
        setSocialLinks(footer.socialLinks ?? defaultFooter.socialLinks);
        setQuickLinks(footer.quickLinks ?? defaultFooter.quickLinks);
        setSitemap(footer.sitemap ?? defaultFooter.sitemap);
        setContact({ ...defaultFooter.contact, ...footer.contact });
        setWhatsapp(footer.whatsapp ?? defaultFooter.whatsapp);
        setShowNewsletter(
          footer.showNewsletter !== undefined ? footer.showNewsletter : defaultFooter.showNewsletter
        );
        setFooterNote(footer.footerNote ?? defaultFooter.footerNote);
        setAdsEnabled(footer.adsEnabled ?? defaultFooter.adsEnabled);
        setAdsClientId(footer.adsClientId ?? defaultFooter.adsClientId);
        setPaymentMethods({ ...defaultFooter.paymentMethods, ...footer.paymentMethods });
        updateStore(data);
      } catch (_err) {
        toast.error(t('load_failed'));
      }
    };
    load();
  }, [updateStore]);

  const handleSocialChange = (index, key, value) => {
    const updated = [...socialLinks];
    updated[index][key] = value;
    setSocialLinks(updated);
  };

  const handleAddSocial = () => {
    setSocialLinks([...socialLinks, { platform: "", url: "" }]);
  };

  const handleRemoveSocial = (index) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const payload = {
      ...config,
      footer: {
        about,
        socialLinks,
        quickLinks,
        sitemap,
        contact,
        whatsapp,
        showNewsletter,
        footerNote,
        adsEnabled,
        adsClientId,
        paymentMethods,
      },
    };
    try {
      const updated = await updateAppConfig(payload);
      setConfig(updated);
      updateStore(updated);

      await fetchConfig();
      toast.success(t('save_success'));
    } catch (_err) {
      toast.error(t('save_failed'));
    }
  };

  return (
    <AdminLayout title={t('title')}>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('title')}</h1>
        </div>

        {/* About */}
        <div className={styles.field}>
          <label className={styles.label}>{t('about_label')}</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            className={styles.textarea}
          />
        </div>

        {/* Social Links */}
        <div className={styles.field}>
          <label className={styles.label}>{t('social_links_label')}</label>
          {socialLinks.map((link, index) => (
            <div key={index} className={styles.inlineCard} style={{ gap: "0.75rem" }}>
              <input
                placeholder={t('social_platform_placeholder')}
                className={styles.input}
                value={link.platform}
                onChange={(e) => handleSocialChange(index, "platform", e.target.value)}
              />
              <input
                placeholder={t('social_url_placeholder')}
                className={styles.input}
                value={link.url}
                onChange={(e) => handleSocialChange(index, "url", e.target.value)}
              />
              <button onClick={() => handleRemoveSocial(index)} className={`${styles.buttonSecondary} ${styles.textDanger}`}>
                <FaTrash />
              </button>
            </div>
          ))}
          <button onClick={handleAddSocial} className={styles.buttonPrimary} style={{ marginTop: "0.5rem" }}>
            <FaPlus /> {t('add_social_link')}
          </button>
        </div>

        {/* Quick Links */}
        <div className={styles.field}>
          <label className={styles.label}>{t('quick_links_label')}</label>
          <input
            type="text"
            value={quickLinks.join(", ")}
            onChange={(e) => setQuickLinks(e.target.value.split(",").map((s) => s.trim()))}
            className={styles.input}
            placeholder={t('quick_links_placeholder')}
          />
        </div>

        {/* Sitemap */}
        <div className={styles.field}>
          <label className={styles.label}>{t('sitemap_label')}</label>
          <input
            type="text"
            value={sitemap.join(", ")}
            onChange={(e) => setSitemap(e.target.value.split(",").map((s) => s.trim()))}
            className={styles.input}
            placeholder={t('sitemap_placeholder')}
          />
        </div>

        {/* Contact Info */}
        <div className={styles.gridTwo}>
          <div className={styles.field}>
            <label className={styles.label}>{t('email_label')}</label>
            <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={styles.input} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('phone_label')}</label>
            <input type="text" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={styles.input} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('address_label')}</label>
            <input type="text" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} className={styles.input} />
          </div>
        </div>

        {/* WhatsApp Contact */}
        <div className={styles.field}>
          <label className={styles.label}>{t('whatsapp_label')}</label>
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className={styles.input}
            placeholder={t('whatsapp_placeholder')}
          />
        </div>

        {/* Newsletter Toggle */}
        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            checked={showNewsletter}
            onChange={() => setShowNewsletter(!showNewsletter)}
          />
          <label className={styles.label}>{t('newsletter_label')}</label>
        </div>

        {/* Footer Note */}
        <div className={styles.field}>
          <label className={styles.label}>{t('footer_note_label')}</label>
          <textarea
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
            rows={2}
            className={styles.textarea}
          />
        </div>

        {/* AdSense Config */}
        <div className={styles.card}>
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              checked={adsEnabled}
              onChange={() => setAdsEnabled(!adsEnabled)}
            />
            <label className={styles.label}>{t('ads_toggle_label')}</label>
          </div>
          <input
            type="text"
            value={adsClientId}
            onChange={(e) => setAdsClientId(e.target.value)}
            className={styles.input}
            placeholder={t('ads_client_id_placeholder')}
          />
        </div>

        {/* Payment Methods */}
        <div className={styles.field}>
          <label className={styles.label}>{t('payment_methods_label')}</label>
          <div className={styles.gridTwo}>
            {Object.keys(paymentMethods).map((method) => (
              <div key={method} className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={paymentMethods[method]}
                  onChange={() => setPaymentMethods((prev) => ({ ...prev, [method]: !prev[method] }))}
                />
                <label className={styles.label} style={{ textTransform: "capitalize" }}>{method}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className={styles.actionsRight}>
          <button
            type="button"
            onClick={handleSave}
            className={styles.buttonPrimary}
          >
            {t('save_settings')}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
