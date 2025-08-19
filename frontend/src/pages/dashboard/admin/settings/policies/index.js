import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import dynamic from "next/dynamic";
import { FaSave, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchPolicies, updatePolicies } from "@/services/admin/policiesService";
import DOMPurify from "dompurify";

// ReactQuill (lazy load to avoid SSR issues)
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

const initialPolicies = {
  "Privacy Policy": {
    title: "Privacy Policy",
    content:
      '<p>We collect personal information that you provide, such as account details and usage data, to operate and improve the Service.</p>' +
      '<p>Your information is stored securely and retained only as long as necessary or as required by law. We do not sell your data and share it only with trusted partners bound by confidentiality.</p>' +
      '<p>You may request access to, correction of, or deletion of your personal data at any time. You may also withdraw consent for certain processing activities by contacting support.</p>',
  },
  "Terms of Service": {
    title: "Terms of Service",
    content:
      '<p>By using the Service you agree to comply with all applicable laws and these terms. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.</p>' +
      '<p>Acceptable use requires respectful behavior and prohibits unauthorized access, disruption of the Service, or use of the platform for unlawful or harmful purposes.</p>' +
      "<p>The Service is provided on an \"as is\" basis without warranties of any kind. Skillbridge's liability is limited to the maximum extent permitted by law, and we are not liable for indirect, incidental, or consequential damages.</p>",
  },
  "Delete Account": {
    title: "Delete Account",
    content:
      '<p>You may request deletion of your account at any time through the account settings page or by contacting support. Once verified, your account and personal data will be permanently removed.</p>' +
      '<p>Certain information may be retained for legal, security, or backup purposes for a limited period. Retained data is securely stored and disposed of when no longer required.</p>',
  },
  Legal: {
    title: "Legal",
    content:
      '<p>All content provided through the Service is for informational purposes only and does not constitute professional advice. We make no warranties regarding the accuracy or completeness of the information.</p>' +
      '<p>These policies and your use of the Service are governed by the laws of the United States, and any disputes shall be resolved in the courts located in the State of California.</p>',
  },
};

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState(initialPolicies);
  const [activeTab, setActiveTab] = useState("Privacy Policy");
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
          setPolicies({ ...initialPolicies, ...data });
        }
      } catch (err) {
        toast.error("Failed to load policies");
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
      toast.success(`✅ ${activeTab} saved successfully!`);
    } catch (err) {
      toast.error("Failed to save policies");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header and Add Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📄 Policy Management</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-4 py-2 rounded shadow flex items-center gap-2"
          >
            <FaPlus /> Add Policy
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
              {tab}
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
            placeholder="Policy Title"
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
              👁 Preview
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-2 rounded-xl shadow transition-base flex items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FaSave /> {isLoading ? 'Saving...' : `Save ${activeTab}`}
            </button>
          </div>
        </div>
      </div>

      {/* ➕ Add Policy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-lg space-y-4">
            <h2 className="text-xl font-bold mb-2">➕ Add New Policy</h2>
            <input
              type="text"
              placeholder="Policy Title"
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
                Cancel
              </button>
              <button
                onClick={() => {
                  const { title, content } = newPolicy;
                  if (title && !policies[title]) {
                    setPolicies((prev) => ({ ...prev, [title]: { title, content } }));
                    setActiveTab(title);
                    setShowAddModal(false);
                    setNewPolicy({ title: "", content: "" });
                    toast.success("✅ New policy added");
                  } else {
                    toast.error("⚠️ Invalid or duplicate policy title");
                  }
                }}
                className="px-4 py-2 rounded bg-yellow-600 text-white font-semibold hover:bg-yellow-700"
              >
                Add Policy
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
