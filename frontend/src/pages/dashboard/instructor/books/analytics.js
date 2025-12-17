import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import PageHead from "@/components/common/PageHead";
import { fetchBookAnalytics } from "@/services/instructor/bookService";
import withAuthProtection from "@/hooks/withAuthProtection";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

function InstructorBookAnalyticsPage() {
  const { t } = useTranslation("dashboard");
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    topBooks: [],
  });

  useEffect(() => {
    fetchBookAnalytics()
      .then((data) => {
        setStats({
          totalSales: data.totalSales ?? 0,
          totalRevenue: data.totalRevenue ?? 0,
          topBooks: data.topBooks || [],
        });
      })
      .catch((err) => {
        console.error("Failed to load analytics", err);
      });
  }, []);

  return (
    <InstructorLayout>
      <PageHead title={t("book_analytics")} />
      <div className="p-6 space-y-8">
        <h1 className="text-2xl font-bold">{t("book_analytics")}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: t("total_sales"), value: stats.totalSales },
            { label: t("total_revenue"), value: stats.totalRevenue },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded shadow p-4 text-center">
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="text-sm text-gray-500">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4">{t("top_books")}</h2>
          <ul className="divide-y">
            {stats.topBooks.length > 0 ? (
              stats.topBooks.map((book, idx) => (
                <li key={book.id || idx} className="py-2 flex justify-between">
                  <span>{book.title}</span>
                  <span className="font-medium">{book.sales ?? book.count ?? 0}</span>
                </li>
              ))
            ) : (
              <li className="py-2 text-center text-gray-500">{t("no_data")}</li>
            )}
          </ul>
        </div>
      </div>
    </InstructorLayout>
  );
}

export default withAuthProtection(InstructorBookAnalyticsPage, ["instructor"]);

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
