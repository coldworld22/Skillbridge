// components/admin/plans/RuleField.js
export default function RuleField({ rule, value, onChange }) {
  const inputClass = "input w-full";

  switch (rule.type) {
    case "toggle":
      return (
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>{rule.label}</span>
        </label>
      );

    case "number":
    case "percentage":
      return (
        <div>
          <label className="block text-sm font-medium">{rule.label}</label>
          <input
            type="number"
            className={inputClass}
            value={value ?? ""}
            onChange={(e) => onChange(+e.target.value)}
          />
        </div>
      );

    default:
      return null;
  }
}
