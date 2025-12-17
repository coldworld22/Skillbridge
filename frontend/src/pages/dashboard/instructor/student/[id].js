import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { fetchInstructorStudentDetail } from "@/services/instructor/studentService";
import {
  fetchClassScores,
  issueClassCertificate,
} from "@/services/classScoreService";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const formatDate = (value, options = { dateStyle: "medium" }) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, options).format(date);
};

const formatPercent = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${Math.round(value)}%`;
};

const formatScore = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${Math.round(value)}/100`;
};

function InstructorStudentDetailPage() {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const { id } = router.query;
  const classId =
    router.query.classId ||
    router.query.class_id ||
    router.query.class ||
    null;

  const [student, setStudent] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (!id || !classId) return;
    let active = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const [detail, scores] = await Promise.all([
          fetchInstructorStudentDetail(classId, id),
          fetchClassScores(classId),
        ]);
        if (!active) return;
        setStudent(detail);
        const match =
          scores?.find(
            (entry) => String(entry.student_id) === String(detail?.id || id),
          ) || null;
        setScore(match);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load instructor student detail", err);
        setError("Unable to load student details.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();

    return () => {
      active = false;
    };
  }, [id, classId]);

  const studentName = student?.full_name || student?.name || t("unknown_user");
  const studentEmail = student?.email || "—";
  const studentPhone = student?.phone || "—";
  const enrollmentStatus = student?.status || "enrolled";
  const enrolledAt = student?.enrolled_at || student?.created_at || null;

  const attendancePct =
    typeof score?.attendance_score === "number"
      ? Math.round(score.attendance_score)
      : null;
  const assignmentScore =
    typeof score?.assignment_score === "number"
      ? Math.round(score.assignment_score)
      : null;
  const totalScore =
    typeof score?.total_score === "number"
      ? Math.round(score.total_score)
      : null;
  const certificateIssued = Boolean(score?.certificate_issued);

  const canIssueCertificate =
    !certificateIssued &&
    typeof attendancePct === "number" &&
    attendancePct >= 90 &&
    Number(assignmentScore ?? 0) > 0;

  const handleIssueCertificate = useCallback(async () => {
    if (!classId || !id) return;
    setIssuing(true);
    try {
      await issueClassCertificate(classId, id);
      setScore((prev) =>
        prev ? { ...prev, certificate_issued: true } : prev,
      );
    } catch (err) {
      console.error("Failed to issue certificate", err);
      alert(
        t("instructorStudentsPage.detail.issue_error", {
          defaultValue: "Unable to issue certificate right now.",
        }),
      );
    } finally {
      setIssuing(false);
    }
  }, [classId, id, t]);

  if (!id) {
    return (
      <div className="p-6 text-sm text-gray-400">
        {t("instructorStudentsPage.detail.missing_student_id", {
          defaultValue: "Student identifier missing from URL.",
        })}
      </div>
    );
  }

  if (!classId) {
    return (
      <div className="p-6 text-sm text-gray-400">
        {t("instructorStudentsPage.detail.missing_class_id", {
          defaultValue:
            "We can't determine which class this student belongs to. Return to the class dashboard and try again.",
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <button
        type="button"
        className="text-sm text-yellow-400 hover:underline"
        onClick={() => router.back()}
      >
        ← {t("back_to_classes", { defaultValue: "Back" })}
      </button>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-400">
              {t("instructorStudentsPage.detail.student_label", {
                defaultValue: "Student",
              })}
            </p>
            <h1 className="text-2xl font-semibold text-white">{studentName}</h1>
            <p className="text-sm text-gray-400">
              {t("instructorStudentsPage.detail.class_label", {
                defaultValue: "Class",
              })}
              :{" "}
              {student?.class_title ||
                student?.class?.title ||
                classId ||
                "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/instructor/online-classes/${classId}/details`}
              className="rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:border-yellow-400 hover:text-white"
            >
              {t("instructorStudentsPage.detail.view_class", {
                defaultValue: "View class",
              })}
            </Link>
            {canIssueCertificate && (
              <button
                type="button"
                onClick={handleIssueCertificate}
                disabled={issuing}
                className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {issuing
                  ? t("instructorStudentsPage.detail.issuing", {
                      defaultValue: "Issuing…",
                    })
                  : t("instructorStudentsPage.detail.issue_certificate", {
                      defaultValue: "Issue certificate",
                    })}
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-gray-400">
          {t("loading_class_data", { defaultValue: "Loading…" })}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-700/40 bg-red-900/30 p-6 text-red-200">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <p className="text-sm text-gray-400">
                {t("instructorStudentsPage.table.status", {
                  defaultValue: "Status",
                })}
              </p>
              <p className="text-2xl font-semibold capitalize text-white">
                {enrollmentStatus}
              </p>
              <p className="text-xs text-gray-500">
                {t("instructorStudentsPage.detail.enrolled_on", {
                  defaultValue: "Enrolled",
                })}
                : {formatDate(enrolledAt, { dateStyle: "medium" })}
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <p className="text-sm text-gray-400">
                {t("instructorStudentsPage.detail.attendance_label", {
                  defaultValue: "Attendance",
                })}
              </p>
              <p className="text-2xl font-semibold text-white">
                {formatPercent(attendancePct)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <p className="text-sm text-gray-400">
                {t("instructorStudentsPage.detail.grade_label", {
                  defaultValue: "Grade",
                })}
              </p>
              <p className="text-2xl font-semibold text-white">
                {formatScore(totalScore)}
              </p>
              <p className="text-xs text-gray-500">
                {certificateIssued
                  ? t("instructorStudentsPage.detail.certificate_issued", {
                      defaultValue: "Certificate issued",
                    })
                  : t("instructorStudentsPage.detail.certificate_pending", {
                      defaultValue: "Certificate pending",
                    })}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-lg font-semibold text-white">
                {t("instructorStudentsPage.detail.profile_section", {
                  defaultValue: "Profile",
                })}
              </h2>
              <dl className="mt-4 space-y-3 text-sm text-gray-300">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Email</dt>
                  <dd className="text-white">{studentEmail}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">
                    {t("instructorStudentsPage.modal.phone", {
                      defaultValue: "Phone",
                    })}
                  </dt>
                  <dd className="text-white">{studentPhone}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">
                    {t("instructorStudentsPage.detail.enrolled_on", {
                      defaultValue: "Enrolled on",
                    })}
                  </dt>
                  <dd className="text-white">
                    {formatDate(enrolledAt, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-lg font-semibold text-white">
                {t("instructorStudentsPage.detail.performance_section", {
                  defaultValue: "Performance",
                })}
              </h2>
              <dl className="mt-4 space-y-3 text-sm text-gray-300">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Attendance</dt>
                  <dd className="text-white">{formatPercent(attendancePct)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Assignments</dt>
                  <dd className="text-white">
                    {assignmentScore !== null
                      ? `${assignmentScore}/100`
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">
                    {t("instructorStudentsPage.detail.final_score", {
                      defaultValue: "Final score",
                    })}
                  </dt>
                  <dd className="text-white">{formatScore(totalScore)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">
                    {t("instructorStudentsPage.detail.certificate_label", {
                      defaultValue: "Certificate",
                    })}
                  </dt>
                  <dd className="text-white">
                    {certificateIssued ? "🎓 Issued" : "⏳ Pending"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

InstructorStudentDetailPage.getLayout = function getLayout(page) {
  return <InstructorLayout>{page}</InstructorLayout>;
};

const ProtectedInstructorStudentDetailPage = withAuthProtection(
  InstructorStudentDetailPage,
  ["instructor"],
);
ProtectedInstructorStudentDetailPage.getLayout =
  InstructorStudentDetailPage.getLayout;

export default ProtectedInstructorStudentDetailPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "dashboard"],
        nextI18NextConfig,
      )),
    },
  };
}
