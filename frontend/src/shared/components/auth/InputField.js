// 📁 src/shared/components/auth/InputField.js
import React, { forwardRef, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./auth.module.scss";

const InputField = forwardRef(({ label, type, placeholder, ...rest }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.inputWrapper}>
        <input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          className={styles.input}
          {...rest}
        />
        {isPassword && (
          <span
            className={styles.eyeToggle}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        )}
      </div>
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
