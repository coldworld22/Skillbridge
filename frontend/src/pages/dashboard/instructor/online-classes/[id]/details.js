import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchInstructorClassById } from "@/services/instructor/classService";
import CustomVideoPlayer from "@/components/shared/CustomVideoPlayer";
import { safeEncodeURI } from "@/utils/url";
import withAuthProtection from "@/hooks/withAuthProtection";
import DOMPurify from "isomorphic-dompurify";

function InstructorClassDetailPage() {
  const { id } = useRouter().query;
  const { t } = useTranslation("dashboard");
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchInstructorClassById(id);
        setDetails(data);
      } catch (err) {
        console.error("Failed to load class", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {t("class_details_title", { id })}
        </h1>
        <Link
          href="/dashboard/instructor/online-classes"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; {t("back_to_my_classes")}
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 text-center">
          {t("loading_class_details")}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 space-y-6">
          {details?.cover_image && (
            <img
              src={details.cover_image}
              alt={t("class_cover_alt")}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}
          {details?.demo_video_url && (
            <div className="mt-4">
              <CustomVideoPlayer
                videos={[{ src: safeEncodeURI(details.demo_video_url) }]}
                storageKey={details?.id ? `instructor-class-${details.id}` : undefined}
              />
            </div>
          )}

          <div className="space-y-1 flex items-center gap-4">
            {details?.instructor_image && (
              <img
                src={details.instructor_image}
                alt={details.instructor}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-2xl font-semibold text-yellow-600">
                {details?.title}
              </h2>
              <p className="text-gray-500 text-sm">
                {t("instructor_label")}: {details?.instructor}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4 text-sm">
            <div className="space-y-1">
              <p>
                <strong>🗓️ {t("class_start_date_label")}:</strong>{" "}
                {details?.startDateInput || details?.start_date || "-"}
              </p>
              <p>
                <strong>🗖 {t("class_end_date_label")}:</strong>{" "}
                {details?.endDateInput || details?.end_date || "-"}
              </p>
              <p>
                <strong>🏷️ {t("class_category_label")}:</strong>{" "}
                {details?.category || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p>
                <strong>📌 {t("class_status_label")}:</strong>{" "}
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {details?.status}
                </span>
              </p>
              {details?.price && (
                <p>
                  <strong>💵 {t("class_price_label")}:</strong> ${details.price}
                </p>
              )}
              <p>
                <strong>👁️ {t("class_views_label")}:</strong>{" "}
                {details?.views ?? 0}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              📘 {t("class_description_title")}
            </h3>
            <p
              className="text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(details?.description || "") }}
            />
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              href={`/dashboard/instructor/online-classes/${id}`}
              className="bg-yellow-500 text-black px-4 py-2 rounded shadow hover:bg-yellow-600 text-sm"
            >
              🚀 {t("manage_class_button")}
            </Link>
            <Link
              href={`/dashboard/instructor/online-classes/${id}/edit`}
              className="bg-gray-700 text-white px-4 py-2 rounded shadow hover:bg-gray-800 text-sm"
            >
              ✏️ {t("edit_class_button")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

InstructorClassDetailPage.getLayout = function getLayout(page) {
  return <InstructorLayout>{page}</InstructorLayout>;
};

const ProtectedInstructorClassDetailPage = withAuthProtection(
  InstructorClassDetailPage,
  ['instructor']
);
ProtectedInstructorClassDetailPage.getLayout = InstructorClassDetailPage.getLayout;
export default ProtectedInstructorClassDetailPage;
export { InstructorClassDetailPage };

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "dashboard"],
        nextI18NextConfig
      )),
    },
  };
}
