import AdminLayout from "@/components/layouts/AdminLayout";
import PageHead from "@/components/common/PageHead";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { fetchAllUsers } from "@/services/admin/userService";

export default function AdminSupportCustomers() {
  const { t } = useTranslation('dashboard');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAllUsers();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AdminLayout>
      <PageHead title={t('customer_management')} />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{t('customer_management')}</h1>
        {loading ? (
          <p className="text-gray-600">{t('loading')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">{t('name')}</th>
                  <th className="px-4 py-2 text-left">{t('email')}</th>
                  <th className="px-4 py-2 text-left">{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2 capitalize">
                      {user.status || 'active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
