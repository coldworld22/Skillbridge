import { useTranslation } from "next-i18next";
import clsx from "clsx";
import styles from "./FloatingInput.module.scss";

export default function FloatingInput({ label, name, value, onChange, type = "text", ...props }) {
  const { i18n } = useTranslation();
  const dir = i18n.dir();
  const raised = Boolean(value);

  return (
    <div className={styles.wrapper} dir={dir}>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={clsx(styles.input, dir === "rtl" && "text-right")}
        placeholder={label}
        {...props}
      />
      <label
        htmlFor={name}
        className={clsx(styles.label, raised && styles.labelRaised, dir === "rtl" && "text-right")}
      >
        {label}
      </label>
    </div>
  );
}
