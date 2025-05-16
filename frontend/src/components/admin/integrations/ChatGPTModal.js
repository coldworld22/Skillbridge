// components/admin/integrations/ChatGPTModal.js
import { useState } from "react";
import { FaTimes, FaSave } from "react-icons/fa";

export default function ChatGPTModal({ onClose }) {
  const [form, setForm] = useState({
    apiKey: "",
    model: "gpt-4",
    temperature: 0.7,
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    console.log("Saving ChatGPT config:", form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Configure ChatGPT</h2>
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
              placeholder="sk-..."
            />
          </div>

          <div>
            <label className="block font-medium">Model</label>
            <select
              value={form.model}
              onChange={(e) => handleChange("model", e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          <div>
            <label className="block font-medium">Temperature</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={form.temperature}
              onChange={(e) => handleChange("temperature", parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
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
