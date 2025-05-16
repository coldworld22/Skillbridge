import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import dynamic from "next/dynamic";
import { FaSave, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";

// ReactQuill (lazy load to avoid SSR issues)
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

const initialPolicies = {
  "Privacy Policy": {
    title: "Privacy Policy",
    content: "<p>We respect your privacy...</p>",
  },
  "Terms & Conditions": {
    title: "Terms & Conditions",
    content: "<p>By using this platform...</p>",
  },
  "Refund Policy": {
    title: "Refund Policy",
    content: "<p>Refunds are only applicable...</p>",
  },
};

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState(initialPolicies);
  const [activeTab, setActiveTab] = useState("Privacy Policy");

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

  const handleSave = () => {
    toast.success(`✅ ${activeTab} saved successfully!`);
    // TODO: Save to backend API
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
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-2 rounded-xl shadow transition-base flex items-center gap-2"
            >
              <FaSave /> Save {activeTab}
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
              dangerouslySetInnerHTML={{ __html: policies[activeTab].content }}
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
