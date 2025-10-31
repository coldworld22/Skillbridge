import { useState } from "react";
import { FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";

const buildInitialState = (initialData = {}) => {
  const base = {
    conversionId: "",
    remarketingEnabled: true,
    enhancedConversions: {
      enabled: false,
      dataLayerKey: "",
    },
    conversions: [],
  };

  const merged = {
    ...base,
    ...initialData,
    enhancedConversions: {
      ...base.enhancedConversions,
      ...(initialData?.enhancedConversions || {}),
    },
  };

  if (!Array.isArray(merged.conversions)) {
    merged.conversions = [];
  }

  return merged;
};

const makeEmptyConversion = () => ({
  event: "",
  sendTo: "",
  defaultValue: "",
  defaultCurrency: "",
});

export default function GoogleAdsModal({ initialData = {}, onClose, onSave }) {
  const [form, setForm] = useState(() => buildInitialState(initialData));

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateConversion = (index, patch) => {
    setForm((prev) => {
      const next = Array.isArray(prev.conversions)
        ? [...prev.conversions]
        : [];
      next[index] = { ...next[index], ...patch };
      return { ...prev, conversions: next };
    });
  };

  const addConversion = () => {
    setForm((prev) => ({
      ...prev,
      conversions: [...(prev.conversions || []), makeEmptyConversion()],
    }));
  };

  const removeConversion = (index) => {
    setForm((prev) => {
      const next = [...(prev.conversions || [])];
      next.splice(index, 1);
      return { ...prev, conversions: next };
    });
  };

  const handleSubmit = async () => {
    if (!onSave) return onClose();

    const trimmedConversions = (form.conversions || []).map((conv) => ({
      event: conv.event?.trim() || "",
      sendTo: conv.sendTo?.trim() || "",
      defaultValue: conv.defaultValue ?? "",
      defaultCurrency: conv.defaultCurrency?.trim() || "",
    }));

    const payload = {
      conversionId: form.conversionId?.trim(),
      remarketingEnabled: Boolean(form.remarketingEnabled),
      enhancedConversions: {
        enabled: Boolean(form.enhancedConversions?.enabled),
        dataLayerKey: form.enhancedConversions?.dataLayerKey?.trim() || "",
      },
      conversions: trimmedConversions.filter(
        (conv) => conv.event && conv.sendTo
      ),
    };

    try {
      await onSave(payload);
      toast.success("Settings saved");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Google Ads Conversion Tracking</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-2xl leading-none"
            aria-label="Close Google Ads settings"
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Configure your Google Ads conversion ID and the conversion events you want
          the platform to track. You can add multiple conversion actions (for example:
          signups, purchases, leads) and map them to <code>send_to</code> values from
          Google Ads.
        </p>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Google Ads Conversion ID
              </label>
              <input
                type="text"
                value={form.conversionId}
                onChange={(e) => handleChange("conversionId", e.target.value)}
                placeholder="e.g., AW-123456789"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in Google Ads &gt; Tools &amp; Settings &gt; Conversions.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enable Remarketing
              </label>
              <select
                value={form.remarketingEnabled ? "true" : "false"}
                onChange={(e) =>
                  handleChange("remarketingEnabled", e.target.value === "true")
                }
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, the global site tag will emit remarketing signals for Google Ads audiences.
              </p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-gray-800">
                Conversion Actions
              </h3>
              <button
                onClick={addConversion}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
              >
                <FaPlus /> Add Conversion
              </button>
            </div>

            {form.conversions.length === 0 && (
              <p className="text-sm text-gray-500">
                No conversion actions configured yet. Add your first conversion to start tracking events.
              </p>
            )}

            <div className="space-y-4">
              {form.conversions.map((conversion, index) => (
                <div
                  key={`conversion-${index}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Event Key
                      </label>
                      <input
                        type="text"
                        value={conversion.event}
                        onChange={(e) =>
                          updateConversion(index, { event: e.target.value })
                        }
                        placeholder="e.g., signup"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Used in code when triggering conversions (example: <code>recordGoogleAdsConversion('signup')</code>).
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        send_to
                      </label>
                      <input
                        type="text"
                        value={conversion.sendTo}
                        onChange={(e) =>
                          updateConversion(index, { sendTo: e.target.value })
                        }
                        placeholder="e.g., AW-123456789/abcDEF123"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Copy the specific conversion action&apos;s <code>send_to</code> value from Google Ads.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Default Value (optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={conversion.defaultValue ?? ""}
                        onChange={(e) =>
                          updateConversion(index, {
                            defaultValue: e.target.value,
                          })
                        }
                        placeholder="e.g., 49.99"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Default Currency (optional)
                      </label>
                      <input
                        type="text"
                        value={conversion.defaultCurrency ?? ""}
                        onChange={(e) =>
                          updateConversion(index, {
                            defaultCurrency: e.target.value,
                          })
                        }
                        placeholder="e.g., USD"
                        className="w-full border border-gray-300 rounded px-3 py-2 uppercase"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removeConversion(index)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    aria-label="Remove conversion"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Tip: Map the event keys to platform actions (e.g., <code>signup</code> when a new account is created,
              <code>purchase</code> after a successful payment). The frontend conversion helper will look up the
              matching <code>send_to</code> value automatically.
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-md font-semibold text-gray-800 mb-3">
              Enhanced Conversions (optional)
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enable Enhanced Conversions
                </label>
                <select
                  value={form.enhancedConversions?.enabled ? "true" : "false"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      enhancedConversions: {
                        ...prev.enhancedConversions,
                        enabled: e.target.value === "true",
                      },
                    }))
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data Layer Key
                </label>
                <input
                  type="text"
                  value={form.enhancedConversions?.dataLayerKey || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      enhancedConversions: {
                        ...prev.enhancedConversions,
                        dataLayerKey: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g., google_enhanced_conversion_data"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: name of a dataLayer variable that holds hashed customer data for enhanced conversions.
                </p>
              </div>
            </div>
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
