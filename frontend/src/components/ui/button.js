// src/components/ui/button.js

import React from "react";
import styles from "./Button.module.scss";

export function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  const variantClass = styles[variant] || "";

  return (
    <button
      className={`${styles.button} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
