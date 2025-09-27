// pages/dashboard/admin/online-classes/[id]/students/[studentId].js
// Admin page showing details for a single student's enrollment
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../../next-i18next.config.js";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchClassStudent } from "@/services/admin/classService";
import withAuthProtection from "@/hooks/withAuthProtection";
import { formatDateWithLocale } from "@/utils/date";

function ManageStudentInClassPage() {
  const { id, studentId } = useRouter().query;
  const { t, i18n } = useTranslation('dashboard');

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !studentId) return;
    async function load() {
      try {
        const data = await fetchClassStudent(id, studentId);
        setStudent(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, studentId]);

  if (loading) {
    return <div className="p-6">{t('common:loading')}</div>;
  }

  if (!student) {
    return <div className="p-6">{t('studentDetailPage.student_not_found')}</div>;
  }

  const lessonList = Array.isArray(student.lessons) ? student.lessons : [];
  const attendanceRecords = Array.isArray(student.attendance)
    ? student.attendance
    : [];
  const notes = Array.isArray(student.notes) ? student.notes : [];
  const certificate = student.certificate ?? null;

  return (
    <div className="p-6 space-y-6" dir={i18n.dir()}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          🧑‍🎓 {t('studentDetailPage.title')}: {student.full_name ?? student.name}
        </h1>
        <Link
          href={`/dashboard/admin/online-classes/${id}/students`}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {t('studentDetailPage.back_to_list')}
        </Link>
      </div>
      <div className="bg-white shadow rounded-xl p-6 border space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p><strong>Name:</strong> {student.full_name ?? student.name}</p>
            <p><strong>Email:</strong> {student.email}</p>
            <p><strong>Status:</strong> {student.status}</p>
          </div>
          <div>
            <p>
              <strong>Certificate:</strong>{' '}
              {student.certificateIssued ? '✅ Issued' : '❌ Not Issued'}
            </p>
            {certificate && (
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>
                  <strong>
                    {t('studentDetailPage.passed_label', { defaultValue: 'Passed' })}:
                  </strong>{' '}
                  {certificate.passed ? '✅' : '⏳'}
                </li>
                {typeof certificate.totalScore === 'number' && (
                  <li>
                    <strong>
                      {t('studentDetailPage.total_score', { defaultValue: 'Total Score' })}:
                    </strong>{' '}
                    {certificate.totalScore}
                  </li>
                )}
                {certificate.issuedAt && (
                  <li>
                    <strong>
                      {t('studentDetailPage.issued_at', { defaultValue: 'Issued At' })}:
                    </strong>{' '}
                    {formatDateWithLocale(certificate.issuedAt, {
                      locale: i18n.language,
                      options: {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      },
                    })}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {lessonList.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">📚 Lesson Progress</h2>
            <ul className="space-y-2">
              {lessonList.map((lesson) => (
                <li
                  key={lesson.id ?? lesson.title}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded"
                >
                  <span>
                    {lesson.order ? `${lesson.order}. ` : ''}
                    {lesson.title}
                  </span>
                  <span className="text-sm text-gray-600">
                    {lesson.completed
                      ? '✅ Completed'
                      : lesson.completed === false
                      ? '⏳ In Progress'
                      : t('studentDetailPage.progress_unknown', {
                          defaultValue: 'Progress unavailable',
                        })}
                    {typeof lesson.testScore !== 'undefined' && (
                      <span className="ml-1">
                        — Test: {lesson.testScore ?? 'N/A'}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {attendanceRecords.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">📅 Attendance</h2>
            <ul className="space-y-2">
              {attendanceRecords.map((record) => (
                <li
                  key={record.id ?? `${record.lessonId}-${record.timestamp}`}
                  className="flex justify-between items-center text-sm bg-gray-100 p-2 rounded"
                >
                  <span>{record.lessonTitle ?? record.lesson}</span>
                  <span>{record.attended ? '✔ Present' : '— Absent'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {notes.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">📝 Notes</h2>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            🎓 {t('studentDetailPage.issue_certificate')}
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            ➕ {t('studentDetailPage.add_note')}
          </button>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-sm">
            ✏️ {t('studentDetailPage.edit_attendance')}
          </button>
        </div>
      </div>
    </div>
  );
}

ManageStudentInClassPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedManageStudentInClassPage = withAuthProtection(
  ManageStudentInClassPage,
  { permissions: ['manage_online_classes'] }
);

ProtectedManageStudentInClassPage.getLayout = ManageStudentInClassPage.getLayout;

export default ProtectedManageStudentInClassPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'dashboard'], nextI18NextConfig)),
    },
  };
}

