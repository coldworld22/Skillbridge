import { Component, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../next-i18next.config.js';
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import AdminClassesTable from "@/components/admin/online-classes/AdminClassesTable";
import {
  FaChalkboardTeacher,
  FaExclamationTriangle,
  FaPlus,
  FaSyncAlt,
} from "react-icons/fa";

class AdminClassesErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Failed to render admin classes table", error, info);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false });
    if (typeof this.props.onReset === "function") {
      this.props.onReset();
    }
  };

  render() {
    const { hasError } = this.state;
    const { children, renderFallback } = this.props;

    if (hasError) {
      if (typeof renderFallback === "function") {
        return renderFallback({ resetErrorBoundary: this.resetErrorBoundary });
      }

      return renderFallback ?? null;
    }

    return children;
  }
}

function AdminOnlineClassesPage() {
  const { t, i18n } = useTranslation('dashboard');
  const direction = typeof i18n?.dir === 'function' ? i18n.dir() : 'ltr';
  const [tableResetKey, setTableResetKey] = useState(0);

  const renderTableFallback = ({ resetErrorBoundary }) => (
    <div
      className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center space-y-4"
      dir={direction}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <FaExclamationTriangle className="h-5 w-5" />
      </div>
      <p className="text-gray-700 font-semibold">
        {t(
          'admin_classes_render_error_title',
          "We couldn't load the online classes"
        )}
      </p>
      <p className="text-gray-500">
        {t(
          'admin_classes_render_error_message',
          'An unexpected error occurred while rendering the classes list.'
        )}
      </p>
      <div className="flex justify-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-yellow-500 rounded-xl shadow hover:bg-yellow-600"
        >
          <FaSyncAlt className="w-4 h-4" />
          {t('retry_loading_classes', 'Try again')}
        </button>
      </div>
    </div>
  );

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
            'bg-yellow-500',
            'hover:bg-yellow-600',
            'text-white',
            'font-semibold',
            'px-4',
            'py-2',
            'rounded-lg',
            'shadow',
            'transition',
            'duration-200',
            'flex',
            'items-center',
            'gap-2',
          ].join(' ')}
        >
          <FaPlus className="w-4 h-4" /> {t('create_class')}
        </Link>
      </div>
      <AdminClassesErrorBoundary
        onReset={() => setTableResetKey((value) => value + 1)}
        renderFallback={renderTableFallback}
      >
        <AdminClassesTable key={tableResetKey} />
      </AdminClassesErrorBoundary>
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


