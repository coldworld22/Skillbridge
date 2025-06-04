// pages/dashboard/admin/users/edit/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import EditUserForm from "@/components/admin/users/EditUserForm"; // move modal form logic here
import { fetchUserById } from "@/services/admin/userService";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";

export default function EditUserPage() {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken } = useAuthStore();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (id && accessToken) {
      fetchUserById(id, accessToken)
        .then((u) => setUser(u))
        .catch(() => toast.error("Failed to load user"));
    }
  }, [id, accessToken]);

  if (!user) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit User</h1>
        <EditUserForm user={user} />
      </div>
    </AdminLayout>
  );
}
