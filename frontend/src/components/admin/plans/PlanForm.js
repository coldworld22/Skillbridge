import { useState } from "react";
import RuleEditor from "./RuleEditor";

// Local rule definitions
const ruleDefinitions = {
  onlineClasses: [
    {
      key: "canCreateClass",
      label: "Can Create Online Class",
      type: "toggle",
      defaultValue: false,
    },
    {
      key: "maxClassPrice",
      label: "Max Class Price",
      type: "number",
      defaultValue: 0,
    },
    {
      key: "platformCut",
      label: "Platform Revenue Cut (%)",
      type: "percentage",
      defaultValue: 20,
    },
    {
      key: "canUseAdvancedTools",
      label: "Access Advanced Tools",
      type: "toggle",
      defaultValue: false,
    },
  ],
  ads: [
    {
      key: "maxAds",
      label: "Max Active Ads",
      type: "number",
      defaultValue: 0,
    },
    {
      key: "canUseBranding",
      label: "Use Branded Ads",
      type: "toggle",
      defaultValue: false,
    },
  ],
  certificates: [
    {
      key: "canGenerate",
      label: "Can Generate Certificates",
      type: "toggle",
      defaultValue: false,
    },
    {
      key: "maxCertificates",
      label: "Max Certificate Downloads",
      type: "number",
      defaultValue: 0,
    },
  ],
};

// Local feature categories
const featureCategories = [
  {
    key: "onlineClasses",
    name: "Online Classes",
    appliesTo: ["student", "instructor"],
  },
  {
    key: "ads",
    name: "Advertisements",
    appliesTo: ["instructor"],
  },
  {
    key: "certificates",
    name: "Certificates",
    appliesTo: ["student", "instructor"],
  },
];

export default function PlanForm({ initialData = {}, onSave }) {
  const [form, setForm] = useState({
    name: "",
    price: 0,
    billingCycle: "monthly",
    status: "active",
    rules: {},
    ...initialData,
  });

  const updateRule = (categoryKey, ruleKey, value) => {
    setForm((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [categoryKey]: {
          ...prev.rules?.[categoryKey],
          [ruleKey]: value,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Plan Name
          </label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            placeholder="Plan Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Price
          </label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            placeholder="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: +e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Billing Cycle
          </label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={form.billingCycle}
            onChange={(e) =>
              setForm({ ...form, billingCycle: e.target.value })
            }
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Plan Status */}
      <div className="mt-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.status !== "inactive"}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.checked ? "active" : "inactive",
              })
            }
          />
          {form.status === "inactive" ? "Inactive" : "Active"}
        </label>
      </div>

      {/* Rules by Category */}
      <div className="space-y-6">
        {featureCategories.map((cat) => (
          <RuleEditor
            key={cat.key}
            category={cat}
            rules={ruleDefinitions[cat.key]}
            values={form.rules?.[cat.key] || {}}
            onChange={(ruleKey, val) => updateRule(cat.key, ruleKey, val)}
          />
        ))}
      </div>

      {/* Save Button */}
      <div className="pt-6">
        <button
          onClick={() => onSave(form)}
          className="btn btn-primary px-6 py-2 rounded text-white"
        >
          Save Plan
        </button>
      </div>
    </div>
  );
}
