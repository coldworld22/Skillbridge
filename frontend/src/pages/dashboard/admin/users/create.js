import withAdminGuard from "@/hooks/withAdminGuard";
// pages/dashboard/admin/users/create.js
import { useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import AddUserModal from "@/components/admin/users/AddUserModal";
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

const ProtectedCreateUserPage = withAdminGuard(CreateUserPage);

export default ProtectedCreateUserPage;
