import React from "react";
import PhoneInput from "react-phone-input-2";
import styles from "./auth.module.scss";

export default function PhoneInputField({ label, value, onChange, ...rest }) {
  return (
    <div className={`${styles.field} ${styles.phoneField}`}>
      <label className={styles.label}>{label}</label>
      <PhoneInput
        country={"sa"}
        value={value}
        onChange={onChange}
        containerClass={styles.phoneField}
        inputClass={styles.phoneWrapper}
        {...rest}
      />
    </div>
  );
}
