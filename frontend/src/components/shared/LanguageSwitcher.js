import useSWR from "swr";
import { useTranslation } from "react-i18next";
import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

const fetcher = url => api.get(url).then(res => res.data.data);

export default function LanguageSwitcher({ changeLang }) {
  const { i18n } = useTranslation();
  const { data: langs } = useSWR("/languages", fetcher);

  if (!langs) {
    return <p className="text-sm px-2">Loading...</p>;
  }

  return (
    <ul className="space-y-1">
      {langs
        .filter((l) => l.is_active)
        .map((lang) => (
          <li key={lang.code}>
            <button
              onClick={() => changeLang(lang.code)}
              className={`flex items-center gap-2 w-full px-3 py-1 rounded-md hover:bg-gray-100 ${
                i18n.language === lang.code ? "bg-gray-100 font-semibold" : ""
              }`}
            >
              {lang.icon_url && (
                <img
                  src={`${API_BASE_URL}${lang.icon_url}`}
                  alt={`${lang.name} flag`}
                  className="w-5 h-5 rounded object-cover"
                />
              )}
              <span>{lang.name}</span>
            </button>
          </li>
        ))}
    </ul>
  );
}
