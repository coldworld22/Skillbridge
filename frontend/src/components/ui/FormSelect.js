// components/ui/FormSelect.js
import styles from "./FormControls.module.scss";

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
}) {
  return (
    <div className={styles.field}>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={styles.select}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
    </div>
  );
}
