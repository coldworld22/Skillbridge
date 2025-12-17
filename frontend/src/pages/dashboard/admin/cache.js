
import AdminLayout from "@/components/layouts/AdminLayout";
import CacheManager from "@/components/pwa/CacheManager";
import withAuthProtection from "@/hooks/withAuthProtection";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";

function AdminCachePage() {
  const { t } = useTranslation("dashboard");

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">{t("clear_cache")}</h1>
        <CacheManager />
      </div>
    </AdminLayout>
  );
}

const ProtectedAdminCachePage = withAuthProtection(AdminCachePage, {
  permissions: ["manage_cache"],
});

export default ProtectedAdminCachePage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
