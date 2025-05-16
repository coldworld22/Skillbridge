// components/ui/FormSelect.js
export default function FormSelect({ label, name, value, onChange, options = [] }) {
  return (
    <div className="relative w-full">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="input-floating"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <label
        className="absolute left-3 top-2 text-gray-500 text-sm transition-all 
        peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base 
        peer-placeholder-shown:text-gray-400 peer-focus:top-1 peer-focus:text-sm 
        peer-focus:text-yellow-600"
      >
        {label}
      </label>
    </div>
  );
}
