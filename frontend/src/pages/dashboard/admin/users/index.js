import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import UserList from "@/components/admin/users/UserList";
import AddUserModal from "@/components/admin/users/AddUserModal";

export default function UsersPage() {
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]); // or fetch from backend

  const handleAddUser = (newUser) => {
    setUsers((prev) => [...prev, { ...newUser, id: Date.now() }]);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
          >
            + Add User
          </button>
        </div>

        <UserList users={users} />
        <AddUserModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleAddUser}
        />
      </div>
    </AdminLayout>
  );
}
