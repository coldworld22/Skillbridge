import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import dynamic from "next/dynamic";
import { FaSave, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { fetchPolicies, updatePolicies } from "@/services/admin/policiesService";
import DOMPurify from "isomorphic-dompurify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import styles from "../settings.module.scss";

// ReactQuill (lazy load to avoid SSR issues)
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

const normalizeTitle = (title) =>
  title
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminPoliciesPage() {
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: "policiesPage" });

  const defaultPolicies = {
    privacy_policy: { id: "privacy_policy", title: t("privacy_policy"), content: "" },
    terms_of_service: { id: "terms_of_service", title: t("terms_of_service"), content: "" },
    delete_account: { id: "delete_account", title: t("delete_account"), content: "" },
    legal: { id: "legal", title: t("legal"), content: "" },
  };

  const [policies, setPolicies] = useState(defaultPolicies);
  const [activeTab, setActiveTab] = useState(Object.keys(defaultPolicies)[0]);
  const [isLoading, setIsLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ title: "", content: "" });

  const [showPreview, setShowPreview] = useState(false);

  const tabs = Object.keys(policies);

  const handleChange = (tab, field, value) => {
    setPolicies((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], [field]: value },
    }));
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPolicies();
        if (data && Object.keys(data).length) {
          setPolicies(data);
          setActiveTab(Object.keys(data)[0]);
        } else {
          setPolicies(defaultPolicies);
          setActiveTab(Object.keys(defaultPolicies)[0]);
        }
      } catch (err) {
        toast.error(t("load_failed"));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updated = await updatePolicies(policies);
      setPolicies(updated);
      toast.success(t("save_success", { title: policies[activeTab].title }));
    } catch (err) {
      toast.error(t("save_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.page} dir={i18n.dir()}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t("title")}</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className={styles.buttonPrimary}
          >
            <FaPlus /> {t("add_policy")}
          </button>
        </div>

        <div className={styles.tabs} style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "0.25rem", marginBottom: "1rem" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            >
              {policies[tab].title}
            </button>
          ))}
        </div>

        <div className={styles.stack}>
          <input
            type="text"
            value={policies[activeTab].title}
            onChange={(e) => handleChange(activeTab, "title", e.target.value)}
            className={styles.input}
            placeholder={t("policy_title_placeholder")}
          />

          <div className={styles.card}>
            <ReactQuill
              theme="snow"
              value={policies[activeTab].content}
              onChange={(value) => handleChange(activeTab, "content", value)}
            />
          </div>

          <div className={styles.actionsRight}>
            <button
              onClick={() => setShowPreview(true)}
              className={styles.buttonSecondary}
            >
              👁 {t("preview")}
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={styles.buttonPrimary}
            >
              <FaSave /> {isLoading ? t("saving") : t("save", { title: policies[activeTab].title })}
            </button>
          </div>
        </div>
      </div>

      {/* ➕ Add Policy Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: 600 }}>
            <h2 className={styles.modalTitle}>➕ {t("add_new_policy")}</h2>
            <input
              type="text"
              placeholder={t("policy_title_placeholder")}
              value={newPolicy.title}
              onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
              className={styles.input}
            />
            <ReactQuill
              theme="snow"
              value={newPolicy.content}
              onChange={(value) => setNewPolicy({ ...newPolicy, content: value })}
            />
            <div className={styles.actionsRight}>
              <button
                onClick={() => setShowAddModal(false)}
                className={styles.buttonSecondary}
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  const { title, content } = newPolicy;
                  const sanitizedTitle = normalizeTitle(title);
                  if (!sanitizedTitle) {
                    toast.error(t("policy_title_empty"));
                    return;
                  }
                  const exists = Object.values(policies).some(
                    (p) => p.title.toLowerCase() === sanitizedTitle.toLowerCase()
                  );
                  if (exists) {
                    toast.error(t("policy_title_exists"));
                    return;
                  }
                  const id = uuidv4();
                  setPolicies((prev) => ({
                    ...prev,
                    [id]: { id, title: sanitizedTitle, content },
                  }));
                  setActiveTab(id);
                  setShowAddModal(false);
                  setNewPolicy({ title: "", content: "" });
                  toast.success(t("new_policy_added"));
                }}
                className={styles.buttonPrimary}
              >
                {t("add_policy")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👁 Preview Modal */}
      {showPreview && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: 800, position: "relative" }}>
            <h2 className={styles.modalTitle}>{policies[activeTab].title}</h2>
            <div
              className={styles.previewBox}
              style={{ maxHeight: "60vh", overflowY: "auto" }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(policies[activeTab].content) }}
            />
            <button
              onClick={() => setShowPreview(false)}
              className={styles.buttonSecondary}
              style={{ position: "absolute", top: 12, right: 12 }}
            >
              ✖
            </button>
          </div>
        </div>
      )}
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
