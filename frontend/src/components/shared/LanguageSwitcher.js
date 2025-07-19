import useSWR from "swr";
import { useTranslation } from "react-i18next";
import api from "@/services/api/api";

const fetcher = url => api.get(url).then(res => res.data.data);

export default function LanguageSwitcher({ changeLang }) {
  const { i18n } = useTranslation();
  const { data: langs } = useSWR("/languages", fetcher);

  return (
    <select
      onChange={(e) => changeLang(e.target.value)}
      value={i18n.language}
      className="border p-1 rounded"
    >
      {langs?.filter((l) => l.is_active).map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
