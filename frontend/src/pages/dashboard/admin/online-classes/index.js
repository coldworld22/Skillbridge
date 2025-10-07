import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../next-i18next.config.js';
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import AdminClassesTable from "@/components/admin/online-classes/AdminClassesTable";
import { FaChalkboardTeacher, FaPlus } from "react-icons/fa";

function AdminOnlineClassesPage() {
  const { t, i18n } = useTranslation('dashboard');
  const direction = typeof i18n?.dir === 'function' ? i18n.dir() : 'ltr';

  return (
    <div className="p-6 space-y-6" dir={direction}>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 flex-wrap" dir={direction}>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaChalkboardTeacher className="w-6 h-6" /> {t('manage_online_classes')}
        </h1>
        <Link
          href="/dashboard/admin/online-classes/create"
          aria-label={t('create_class')}
          className={[
            'bg-yellow-500 hover:bg-yellow-600 text-white font-semibold',
            'px-4 py-2 rounded-lg shadow transition duration-200',
            'flex items-center gap-2',
          ].join(' ')}
        >
          <FaPlus className="w-4 h-4" /> {t('create_class')}
        </Link>
      </div>
      <AdminClassesTable />
    </div>
  );
}

AdminOnlineClassesPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};


const ProtectedAdminOnlineClassesPage = withAuthProtection(
  AdminOnlineClassesPage,
  {
    roles: ["admin", "superadmin"],
    permissions: ["manage_online_classes"],
  }
);

ProtectedAdminOnlineClassesPage.getLayout = AdminOnlineClassesPage.getLayout;

export default ProtectedAdminOnlineClassesPage;

export async function getStaticProps({ locale }) {
  const namespaces = ['common', 'dashboard'];

  return {
    props: {
      ...(await serverSideTranslations(locale, namespaces, nextI18NextConfig)),
    },
  };
}


