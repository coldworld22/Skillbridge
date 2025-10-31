import Link from "next/link";
import StudentLayout from "@/components/layouts/StudentLayout";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const infoCards = (t) => [
  {
    title: t("benefits.connect_title"),
    body: t("benefits.connect_body"),
    link: "/dashboard/student/groups/explore",
    linkLabel: t("benefits.connect_cta"),
  },
  {
    title: t("benefits.collaborate_title"),
    body: t("benefits.collaborate_body"),
    link: "/dashboard/student/groups/my-groups",
    linkLabel: t("benefits.collaborate_cta"),
  },
  {
    title: t("benefits.lead_title"),
    body: t("benefits.lead_body"),
    link: "/dashboard/student/groups/create",
    linkLabel: t("benefits.lead_cta"),
  },
];

const StudentGroupsLanding = () => {
  const { t } = useTranslation("dashboard", { keyPrefix: "groupsLanding" });

  return (
    <section className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {t("title")}
          </h1>
          <p className="mt-4 text-base text-gray-600 max-w-3xl mx-auto">
            {t("intro")}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {infoCards(t).map((card) => (
            <article
              key={card.title}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-6 flex flex-col"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {card.title}
              </h2>
              <p className="text-sm text-gray-600 flex-grow">{card.body}</p>
              <Link
                href={card.link}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mt-6"
              >
                {card.linkLabel}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-14 bg-blue-50 border border-blue-100 rounded-2xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-2xl font-semibold text-blue-900 mb-2">
              {t("cta.title")}
            </h3>
            <p className="text-sm text-blue-800 max-w-2xl">
              {t("cta.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/student/groups/create"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            >
              {t("cta.create")}
            </Link>
            <Link
              href="/dashboard/student/groups/explore"
              className="px-4 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-100 font-semibold transition"
            >
              {t("cta.discover")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

StudentGroupsLanding.getLayout = (page) => (
  <StudentLayout>{page}</StudentLayout>
);

export const getServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale,
      ["dashboard"],
      nextI18NextConfig
    )),
  },
});

export default StudentGroupsLanding;
