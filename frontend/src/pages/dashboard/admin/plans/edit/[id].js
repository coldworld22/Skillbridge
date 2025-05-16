import { useState, useEffect } from "react";
import { ChromePicker } from "react-color";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";
import Link from "next/link";

const mockPlanData = {
  1: {
    name: "Basic Plan",
    price: "$10/month",
    duration: "Monthly",
    popular: false,
    color: "#1f2937",
    textColor: "#ffffff",
    categories: [
      {
        title: "Community",
        rules: [
          { label: "Read Forum", type: "boolean", value: true },
          { label: "Post Questions", type: "boolean", value: false }
        ]
      }
    ]
  },
  2: {
    name: "Premium Plan",
    price: "$30/month",
    duration: "Monthly",
    popular: true,
    color: "#facc15",
    textColor: "#111827",
    categories: [
      {
        title: "Live Classes",
        rules: [
          { label: "Join Sessions", type: "boolean", value: true },
          { label: "Max Classes", type: "number", value: 20 }
        ]
      }
    ]
  }
};

export default function EditPlanPage() {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const planData = mockPlanData[router.query.id];
    if (planData) {
      setForm(planData);
    } else {
      setForm({
        name: "",
        price: "",
        duration: "Monthly",
        popular: false,
        color: "#ffffff",
        textColor: "#000000",
        categories: []
      });
    }
  }, [router.isReady]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert("Please fill in both name and price.");
      return;
    }
    console.log("Updated Plan:", form);
    router.push("/dashboard/admin/plans");
  };

  const handleAddCategory = () => {
    setForm((prev) => ({
      ...prev,
      categories: [...prev.categories, { title: "", rules: [] }]
    }));
  };

  const handleCategoryChange = (index, value) => {
    const updated = [...form.categories];
    updated[index].title = value;
    setForm({ ...form, categories: updated });
  };

  const handleAddRule = (catIndex) => {
    const updated = [...form.categories];
    updated[catIndex].rules.push({ label: "", type: "boolean", value: false });
    setForm({ ...form, categories: updated });
  };

  const handleRuleChange = (catIndex, ruleIndex, field, value) => {
    const updated = [...form.categories];
    updated[catIndex].rules[ruleIndex][field] = value;
    setForm({ ...form, categories: updated });
  };

  const removeCategory = (index) => {
    const updated = [...form.categories];
    updated.splice(index, 1);
    setForm({ ...form, categories: updated });
  };

  if (!form) return <AdminLayout title="Edit Plan"><p>Loading...</p></AdminLayout>;

  return (
    <AdminLayout title={`Edit ${form.name}`}>
      <div className="flex justify-between items-center mb-6">
        <Link href="/dashboard/admin/plans">
          <button className="flex items-center gap-2 text-gray-600 hover:text-black">
            <FaArrowLeft /> Back to Plans
          </button>
        </Link>
        <button
          onClick={handleSubmit}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaSave /> Update Plan
        </button>
      </div>

      <div className="bg-white rounded shadow p-6 space-y-6">
        <input
          className="w-full border px-4 py-2 rounded"
          placeholder="Plan Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="w-full border px-4 py-2 rounded"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium mb-1">Plan Duration</label>
          <select
            className="w-full border px-4 py-2 rounded"
            value={form.duration || "Monthly"}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
          >
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.popular}
            onChange={(e) => setForm({ ...form, popular: e.target.checked })}
          />
          Mark as Most Popular
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-2">Background Color</label>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded border cursor-pointer"
                style={{ backgroundColor: form.color }}
                onClick={() => setShowBgPicker(!showBgPicker)}
              />
              <input
                type="text"
                className="border px-3 py-1 rounded w-full"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
            {showBgPicker && (
              <div className="mt-2">
                <ChromePicker
                  color={form.color}
                  onChangeComplete={(color) =>
                    setForm({ ...form, color: color.hex })
                  }
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium mb-2">Text Color</label>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded border cursor-pointer"
                style={{ backgroundColor: form.textColor }}
                onClick={() => setShowTextPicker(!showTextPicker)}
              />
              <input
                type="text"
                className="border px-3 py-1 rounded w-full"
                value={form.textColor}
                onChange={(e) => setForm({ ...form, textColor: e.target.value })}
              />
            </div>
            {showTextPicker && (
              <div className="mt-2">
                <ChromePicker
                  color={form.textColor}
                  onChangeComplete={(color) =>
                    setForm({ ...form, textColor: color.hex })
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quick Color Presets</label>
          <div className="flex gap-2 flex-wrap">
            {["#1f2937", "#facc15", "#6366f1", "#10b981", "#dc2626"].map((bg, idx) => (
              <button
                key={idx}
                type="button"
                className="px-4 py-2 rounded shadow"
                style={{ backgroundColor: bg, color: "#ffffff" }}
                onClick={() =>
                  setForm({ ...form, color: bg, textColor: "#ffffff" })
                }
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {form.categories.map((cat, catIndex) => (
            <div key={catIndex} className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <input
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Category Title"
                  value={cat.title}
                  onChange={(e) => handleCategoryChange(catIndex, e.target.value)}
                />
                <button className="text-red-500 ml-4" onClick={() => removeCategory(catIndex)}>
                  <FaTrash />
                </button>
              </div>

              {cat.rules.map((rule, ruleIndex) => (
                <div key={ruleIndex} className="grid grid-cols-3 gap-4">
                  <input
                    className="border px-2 py-1 rounded"
                    placeholder="Rule Label"
                    value={rule.label}
                    onChange={(e) => handleRuleChange(catIndex, ruleIndex, "label", e.target.value)}
                  />
                  <select
                    className="border px-2 py-1 rounded"
                    value={rule.type}
                    onChange={(e) => handleRuleChange(catIndex, ruleIndex, "type", e.target.value)}
                  >
                    <option value="boolean">Toggle</option>
                    <option value="number">Number</option>
                    <option value="text">Text</option>
                  </select>
                  {rule.type === "boolean" ? (
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rule.value}
                        onChange={(e) => handleRuleChange(catIndex, ruleIndex, "value", e.target.checked)}
                      />
                      Enabled
                    </label>
                  ) : (
                    <input
                      className="border px-2 py-1 rounded"
                      placeholder={rule.type === "number" ? "0" : "Value"}
                      value={rule.value}
                      onChange={(e) => handleRuleChange(catIndex, ruleIndex, "value", e.target.value)}
                    />
                  )}
                </div>
              ))}

              <button className="text-blue-500 mt-2" onClick={() => handleAddRule(catIndex)}>
                <FaPlus className="inline-block mr-1" /> Add Rule
              </button>
            </div>
          ))}
        </div>

        <button className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded" onClick={handleAddCategory}>
          <FaPlus className="inline-block mr-2" /> Add Category
        </button>

        <div className="mt-10 p-4 rounded shadow border" style={{ backgroundColor: form.color, color: form.textColor }}>
          <h2 className="text-xl font-bold">{form.name || "Plan Title"}</h2>
          <p className="text-lg">{form.price || "$0.00"}</p>
          <p className="text-sm italic">{form.duration || "Monthly"}</p>
          {form.popular && (
            <span className="inline-block bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold mt-2">
              🌟 Popular
            </span>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}