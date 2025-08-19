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
      <div className="max-w-5xl mx-auto px-6 py-10" dir={i18n.dir()}>
        {/* Header and Add Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-4 py-2 rounded shadow flex items-center gap-2"
          >
            <FaPlus /> {t("add_policy")}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-base ${
                activeTab === tab
                  ? "bg-yellow-500 text-gray-900"
                  : "text-gray-500 hover:text-yellow-600"
              }`}
            >
              {policies[tab].title}
            </button>
          ))}
        </div>

        {/* Editor for Active Tab */}
        <div className="space-y-4">
          <input
            type="text"
            value={policies[activeTab].title}
            onChange={(e) => handleChange(activeTab, "title", e.target.value)}
            className="input-floating"
            placeholder={t("policy_title_placeholder")}
          />

          <ReactQuill
            theme="snow"
            value={policies[activeTab].content}
            onChange={(value) => handleChange(activeTab, "content", value)}
            className="bg-white dark:bg-gray-800 rounded"
          />

          <div className="flex justify-between items-center gap-4 mt-4">
            <button
              onClick={() => setShowPreview(true)}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-800 dark:text-white px-4 py-2 rounded-md transition-base"
            >
              👁 {t("preview")}
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-2 rounded-xl shadow transition-base flex items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FaSave /> {isLoading ? t("saving") : t("save", { title: policies[activeTab].title })}
            </button>
          </div>
        </div>
      </div>

      {/* ➕ Add Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold mb-2">➕ {t("add_new_policy")}</h2>
            <input
              type="text"
              placeholder={t("policy_title_placeholder")}
              value={newPolicy.title}
              onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
              className="input-floating"
            />
            <ReactQuill
              theme="snow"
              value={newPolicy.content}
              onChange={(value) => setNewPolicy({ ...newPolicy, content: value })}
              className="bg-white dark:bg-gray-800 rounded"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
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
                className="px-4 py-2 rounded bg-yellow-600 text-white font-semibold hover:bg-yellow-700"
              >
                {t("add_policy")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👁 Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg max-w-3xl w-full relative">
            <h2 className="text-xl font-bold mb-4">{policies[activeTab].title}</h2>
            <div
              className="prose dark:prose-invert max-h-[60vh] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(policies[activeTab].content) }}
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-3 right-3 bg-gray-300 dark:bg-gray-700 px-3 py-1 rounded"
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
