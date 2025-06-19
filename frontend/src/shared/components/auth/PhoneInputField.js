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
        inputClass="!bg-gray-700 !text-white !w-full !py-2 !pl-12 !pr-3 !border !rounded-lg"
        buttonClass="!bg-gray-700 border-r !border-gray-600"
        containerClass="!w-full"
        {...rest}
      />
    </div>
  );
}
