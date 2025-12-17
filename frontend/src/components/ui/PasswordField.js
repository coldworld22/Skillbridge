// components/ui/PasswordField.js
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./FormControls.module.scss";

export default function PasswordField({ name, label, value, onChange }) {
  const [show, setShow] = useState(false);

  return (
    <div className={styles.field}>
      <input
        id={name}
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`${styles.input} ${styles.withIcon}`}
      />
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <button
        type="button"
        onClick={() => setShow(!show)}
        className={styles.iconButton}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}
