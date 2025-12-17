import useSWR from "swr";
import { useTranslation } from "next-i18next";
import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";
import styles from "./LanguageSwitcher.module.scss";

const fetcher = url => api.get(url).then(res => res.data.data);

export default function LanguageSwitcher({ changeLang }) {
  const { i18n, t } = useTranslation("common");
  const { data: langs, error } = useSWR("/languages", fetcher);

  if (error) {
    return <p className={`${styles.text} ${styles.error}`}>{t('language_load_error')}</p>;
  }

  if (!langs) {
    return <p className={styles.text}>{t('loading')}</p>;
  }

  return (
    <ul className={styles.list}>
      {langs
        .filter((l) => l.is_active)
        .map((lang) => (
          <li key={lang.code}>
            <button
              onClick={() => changeLang(lang.code)}
              className={`${styles.button} ${i18n.language === lang.code ? styles.buttonActive : ""}`}
            >
              <img
                src={
                  lang.icon_url
                    ? `${API_BASE_URL}${lang.icon_url}`
                    : "/flags/default.png"
                }
                alt={`${lang.name} flag`}
                className={styles.flag}
              />
              <span>{lang.name}</span>
            </button>
          </li>
        ))}
    </ul>
  );
}
