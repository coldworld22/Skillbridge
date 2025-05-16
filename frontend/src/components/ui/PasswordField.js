// components/ui/PasswordField.js
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function PasswordField({ name, label, value, onChange }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative w-full">
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder=" "
        className="input-floating pr-10"
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
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-[38px] text-gray-500"
      >
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}
