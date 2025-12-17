// components/ui/FormField.js
import styles from "./FormControls.module.scss";

export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = " ",
  required = false,
}) {
  return (
    <div className={styles.field}>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={styles.input}
      />
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
    </div>
  );
}
