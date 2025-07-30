// components/admin/integrations/DeepSeekModal.js
import { useState } from "react";
import { FaTimes, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";

export default function DeepSeekModal({ initialData = {}, onClose, onSave }) {
  const [form, setForm] = useState({
    apiKey: "",
    model: "deepseek-chat",
    maxTokens: 1024,
    active: true,
    ...initialData,
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!onSave) return onClose();
    try {
      await onSave(form);
      toast.success("Settings saved");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Configure DeepSeek</h2>
          <button onClick={onClose}>
            <FaTimes className="text-gray-600 hover:text-red-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block font-medium">API Key</label>
            <input
              type="text"
              value={form.apiKey}
              onChange={(e) => handleChange("apiKey", e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="your-deepseek-key"
            />
          </div>

          <div>
            <label className="block font-medium">Model</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => handleChange("model", e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="deepseek-chat"
            />
          </div>

          <div>
            <label className="block font-medium">Max Tokens</label>
            <input
              type="number"
              value={form.maxTokens}
              onChange={(e) => handleChange("maxTokens", parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => handleChange('active', e.target.checked)}
            />
            Active
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600">
            <FaSave className="inline-block mr-2" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
