import React from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export default function PhoneInputField({ label, value, onChange, ...rest }) {
  return (
    <div className="mt-4 w-full">
      <label className="block text-gray-400 mb-1">{label}</label>
      <PhoneInput
        country={"sa"}
        value={value}
        onChange={onChange}
        {...rest}
      />
    </div>
  );
}
