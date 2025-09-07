import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import CacheManager from "@/components/pwa/CacheManager";

function CachePage() {
  const { t } = useTranslation("dashboard");

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">{t("clear_cache")}</h1>
        <CacheManager />
      </div>
    </AdminLayout>
  );
}

const ProtectedCachePage = withAuthProtection(CachePage, ["admin", "superadmin"]);

export default ProtectedCachePage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
