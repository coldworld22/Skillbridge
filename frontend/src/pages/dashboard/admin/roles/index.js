import React from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import RoleManagement from "@/components/admin/roles/RoleManagement";
import withAuthProtection from "@/hooks/withAuthProtection";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

function RolesPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "rolesPage" });

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>

        <RoleManagement />
      </div>
    </AdminLayout>
  );
}

const ProtectedRolesPage = withAuthProtection(RolesPage, { permissions: ["view_roles"] });

export default ProtectedRolesPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
