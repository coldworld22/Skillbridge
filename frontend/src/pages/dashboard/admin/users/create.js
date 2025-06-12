// pages/dashboard/admin/users/create.js
import AdminLayout from "@/components/layouts/AdminLayout";
import AddUserForm from "@/components/admin/users/AddUserForm";

export default function CreateUserPage() {
  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Add New User</h1>
        <AddUserForm />
      </div>
    </AdminLayout>
  );
}
