import React from "react";
import { FaPhone } from "react-icons/fa";

const FloatingCallButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition"
    >
      <FaPhone className="text-2xl" />
    </button>
  );
};

export default FloatingCallButton;
