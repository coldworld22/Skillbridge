export default function FloatingInput({ label, name, value, onChange, type = "text", ...props }) {
  return (
    <div className="relative mt-4 w-full">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="peer w-full border border-gray-300 rounded px-3 pt-5 pb-2 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
        placeholder={label}
        {...props}
      />
      <label
        htmlFor={name}
        className="absolute left-3 top-2 text-gray-500 text-xs transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-yellow-600"
      >
        {label}
      </label>
    </div>
  );
}
