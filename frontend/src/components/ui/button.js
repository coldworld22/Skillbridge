// src/components/ui/button.js

import React from "react";

export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded font-semibold focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
