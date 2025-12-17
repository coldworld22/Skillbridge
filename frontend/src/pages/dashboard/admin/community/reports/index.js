import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaExclamationCircle, FaTrash, FaEye, FaCheck } from "react-icons/fa";
import { fetchReports, updateReportStatus } from "@/services/admin/communityService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { toast } from "react-toastify";

export default function AdminCommunityReportsPage() {
  const { t } = useTranslation("dashboard", {
    keyPrefix: "communityReportsPage",
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchReports();
        const formatted = (data || []).map((r) => ({
          id: r.id,
          reason: r.reason,
          content: r.content || "",
          user: r.reporter_id,
          discussionId: r.discussion_id,
           status: r.status || "pending",
           reportedAt: r.reported_at || null,
        }));
        if (active) {
          setReports(formatted);
        }
      } catch (err) {
        console.error("Failed to load reports", err);
        if (active) {
          setError(t("load_failed", "Unable to load reports right now."));
          toast.error(t("load_failed", "Unable to load reports right now."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [t]);

  const handleReview = (report) => {
    window.open(`/dashboard/admin/community/discussions/${report.discussionId}`, "_blank");
  };

  const updateStatus = async (reportId, status, successMessage) => {
    try {
      await updateReportStatus(reportId, status);
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId ? { ...report, status } : report
        )
      );
      toast.success(successMessage);
    } catch (err) {
      console.error("Failed to update report status", err);
      toast.error(t("update_failed", "Failed to update report status"));
    }
  };

  const handleResolve = (reportId) => {
    updateStatus(reportId, "resolved", t("resolved_success", "Report marked as resolved"));
  };

  const handleDismiss = (reportId) => {
    const confirmDelete = confirm(t("confirm_delete"));
    if (!confirmDelete) return;
    updateStatus(reportId, "dismissed", t("dismissed_success", "Report dismissed"));
  };

  const sortedReports = useMemo(
    () =>
      [...reports].sort((a, b) => {
        if (a.status === b.status) return 0;
        if (a.status === "pending") return -1;
        if (b.status === "pending") return 1;
        return a.status.localeCompare(b.status);
      }),
    [reports]
  );

  return (
    <AdminLayout title={t("title")}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t("heading")}</h1>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500">{t("loading", "Loading reports...")}</p>
          ) : sortedReports.length > 0 ? (
            sortedReports.map((report) => (
              <div
                key={report.id}
                className="bg-white border-l-4 border-red-500 p-4 rounded shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-red-600 flex items-center gap-2">
                      <FaExclamationCircle /> {report.reason}
                    </h4>
                    <p className="text-sm text-gray-700 mt-2">"{report.content}"</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("reported_by", { user: report.user })}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${
                          report.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : report.status === "resolved"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t(`status.${report.status}`, report.status)}
                      </span>
                      {report.reportedAt && (
                        <span className="text-gray-400">
                          {new Date(report.reportedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleReview(report)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      <FaEye className="inline mr-1" /> {t("review")}
                    </button>
                    {report.status !== "resolved" && (
                      <button
                        onClick={() => handleResolve(report.id)}
                        className="text-sm text-green-600 hover:underline"
                      >
                        <FaCheck className="inline mr-1" /> {t("resolve", "Resolve")}
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(report.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      <FaTrash className="inline mr-1" /> {t("delete")}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">{t("no_reports")}</p>
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
