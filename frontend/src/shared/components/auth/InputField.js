// 📁 src/shared/components/auth/InputField.js
import React, { forwardRef, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const InputField = forwardRef(({ label, type, placeholder, ...rest }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="mt-4 w-full">
      <label className="block text-gray-400 mb-1">{label}</label>
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          {...rest}
          className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
        />
        {isPassword && (
          <span
            className="absolute right-3 top-3 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
          </span>
        )}
      </div>
    </div>
  );
});

export default InputField;
