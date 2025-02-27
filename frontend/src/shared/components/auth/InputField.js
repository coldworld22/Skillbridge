import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function InputField({ label, type, placeholder, value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="mt-4 w-full">
      <label className="block text-gray-400">{label}</label>
      <div className="relative">
        <input
          type={type === "password" && showPassword ? "text" : type}
          className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {type === "password" && (
          <span className="absolute right-3 top-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
          </span>
        )}
      </div>
    </div>
  );
}
