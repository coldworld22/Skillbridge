// pages/dashboard/admin/users/create.js
import { useState } from "react";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import AddUserModal from "@/components/admin/users/AddUserModal";
import withAdminGuard from "@/hooks/withAdminGuard";
import { createUser } from "@/services/admin/userService";

function CreateUserPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    router.push("/dashboard/admin/users");
  };

  const handleSubmit = async (formData) => {
    await createUser(formData);
  };

  return (
    <AdminLayout>
      <AddUserModal isOpen={isOpen} onClose={handleClose} onSubmit={handleSubmit} />
    </AdminLayout>
  );
}

export default withAdminGuard(CreateUserPage);

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard", "auth"], nextI18NextConfig)),
    },
  };
}
