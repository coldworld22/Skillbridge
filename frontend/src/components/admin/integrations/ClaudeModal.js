import { useState } from "react";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";

export default function ClaudeModal({ initialData = {}, onClose, onSave }) {
  const [form, setForm] = useState({
    apiKey: "",
    model: "claude-3-opus",
    active: true,
    ...initialData,
  });

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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Claude (Anthropic) Configuration</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="text"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="claude-api-key"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="e.g., claude-3-opus"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-2">
            <FaSave /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
