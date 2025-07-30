// components/admin/integrations/ChatGPTModal.js
import { useState } from "react";
import { FaTimes, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";

export default function ChatGPTModal({ initialData = {}, onClose, onSave }) {
  const initModels = initialData.models
    ? initialData.models
    : initialData.model
      ? [{ name: initialData.model, temperature: initialData.temperature ?? 0.7 }]
      : [{ name: "gpt-4", temperature: 0.7 }];

  const [form, setForm] = useState({
    apiKey: initialData.apiKey || "",
    models: initModels,
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleModelChange = (index, key, value) => {
    setForm((prev) => {
      const models = [...prev.models];
      models[index] = { ...models[index], [key]: value };
      return { ...prev, models };
    });
  };

  const addModel = () => {
    setForm((prev) => ({
      ...prev,
      models: [...prev.models, { name: "", temperature: 0.7 }],
    }));
  };

  const removeModel = (index) => {
    setForm((prev) => ({
      ...prev,
      models: prev.models.filter((_, i) => i !== index),
    }));
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

          <div className="space-y-3">
            <label className="block font-medium">Models</label>
            {form.models.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) => handleModelChange(idx, "name", e.target.value)}
                  placeholder="gpt-4"
                  className="flex-1 border border-gray-300 rounded px-2 py-1"
                />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={m.temperature}
                  onChange={(e) =>
                    handleModelChange(idx, "temperature", parseFloat(e.target.value))
                  }
                  className="w-24 border border-gray-300 rounded px-2 py-1"
                />
                {form.models.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeModel(idx)}
                    className="text-red-600"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addModel}
              className="text-sm text-blue-600 hover:underline"
            >
              Add model
            </button>
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
