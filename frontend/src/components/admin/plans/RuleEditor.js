// components/admin/plans/RuleEditor.js
import RuleField from "./RuleField";

export default function RuleEditor({ category, rules, values, onChange }) {
  return (
    <div className="border p-4 rounded bg-gray-50">
      <h3 className="font-bold text-lg mb-3">{category.name}</h3>
      <div className="space-y-4">
        {rules.map((rule) => (
          <RuleField
            key={rule.key}
            rule={rule}
            value={values[rule.key]}
            onChange={(val) => onChange(rule.key, val)}
          />
        ))}
      </div>
    </div>
  );
}
