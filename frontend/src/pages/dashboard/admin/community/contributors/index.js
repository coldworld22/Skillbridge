import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSearch, FaDownload } from "react-icons/fa";
import { fetchContributors } from "@/services/admin/communityService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function AdminContributorsPage() {
  const { t } = useTranslation("dashboard", {
    keyPrefix: "communityContributorsPage",
  });
  const [contributors, setContributors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchContributors();
        setContributors(data);
      } catch (err) {
        console.error("Contributors fetch error:", err);
      }
    };
    load();
  }, []);

  const filtered = contributors.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportCSV = () => {
    const header = t("csv_header");
    const rows = contributors
      .map((c) => `${c.name},${c.contributions},${c.reputation}`)
      .join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contributors.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title={t("title")}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">{t("heading")}</h1>
            <p className="text-sm text-gray-500">{t("description")}</p>
          </div>
          <button
            onClick={exportCSV}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaDownload /> {t("export")}
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <input
            type="text"
            placeholder={t("search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg pr-10"
          />
          <FaSearch className="absolute top-3 right-3 text-gray-400" />
        </div>

        {/* Contributor List */}
        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map((user) => (
              <div key={user.id} className="bg-white p-4 rounded shadow-sm flex items-center gap-4">
                <img
                  src={user.avatar || "/images/default-avatar.png"}
                  className="w-12 h-12 rounded-full border"
                  alt={user.name}
                />
                <div>
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <p className="text-sm text-gray-500">
                    {t("meta", {
                      contributions: user.contributions,
                      reputation: user.reputation,
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">{t("no_contributors")}</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
