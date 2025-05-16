// components/ui/FormField.js
export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = " ",
  required = false,
}) {
  return (
    <div className="relative w-full">
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="peer input-floating"
      />
      <label
        htmlFor={name}
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
