import { useState } from "react";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";

export default function GoogleAnalyticsModal({ initialData = {}, onClose, onSave }) {
  const [form, setForm] = useState({ measurementId: "", enabled: true, ...initialData });

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
          <h2 className="text-xl font-bold">Google Analytics Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">GA4 Measurement ID</label>
            <input
              type="text"
              value={form.measurementId}
              onChange={(e) => setForm({ ...form, measurementId: e.target.value })}
              placeholder="e.g., G-XXXXXXX"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Enable Tracking</label>
            <select
              value={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.value === 'true' })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2"
          >
            <FaSave /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
