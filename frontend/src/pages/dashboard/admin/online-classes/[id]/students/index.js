// Admin page listing students enrolled in a specific class
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchClassStudents } from "@/services/admin/classService";
import withAuthProtection from "@/hooks/withAuthProtection";

function ClassStudentsPage() {
  const { id } = useRouter().query;
  const { t, i18n } = useTranslation('dashboard');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const list = await fetchClassStudents(id);
        setStudents(list);
      } catch (err) {
        console.error(err);
        setError("Failed to load students");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <div className="p-6 space-y-6" dir={i18n.dir()}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          {t('classStudentsPage.title')}
        </h1>
        <Link
          href={`/dashboard/admin/online-classes/${id}`}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {t('classStudentsPage.back_to_class')}
        </Link>
      </div>
      {loading ? (
        <p>{t('common:loading')}</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : students.length === 0 ? (
        <p>{t('classStudentsPage.no_students')}</p>
      ) : (
        <div className="overflow-x-auto">

          <table className="min-w-full table-auto border-collapse border border-gray-200 rounded-md shadow-sm">
            <thead className="bg-gray-50">

              <tr>
                <th className="border p-2 text-left">{t('instructorDashboardPage.name')}</th>
                <th className="border p-2 text-left">{t('instructorDashboardPage.email')}</th>
                <th className="border p-2">{t('classStudentsPage.status')}</th>
                <th className="border p-2">{t('classStudentsPage.date_joined')}</th>
              </tr>
            </thead>
            <tbody>
              {students.map((stu) => (
                <tr key={stu.id} className="odd:bg-white even:bg-gray-50">
                  <td className="border p-2">
                    <Link
                      href={`/dashboard/admin/online-classes/${id}/students/${stu.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {stu.full_name}
                    </Link>
                  </td>
                  <td className="border p-2">{stu.email}</td>
                  <td className="border p-2 text-center">{stu.status}</td>
                  <td className="border p-2 text-center">
                    {new Date(stu.enrolled_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

ClassStudentsPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedClassStudentsPage = withAuthProtection(ClassStudentsPage, {
  permissions: ['manage_online_classes'],
});

ProtectedClassStudentsPage.getLayout = ClassStudentsPage.getLayout;

export default ProtectedClassStudentsPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'dashboard'], nextI18NextConfig)),
    },
  };
}
