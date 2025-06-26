import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import AdminClassesTable from "@/components/admin/online-classes/AdminClassesTable";
import { fetchAdminClasses } from "@/services/admin/classService";
import { FaChalkboardTeacher, FaPlus } from "react-icons/fa";

function AdminOnlineClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await fetchAdminClasses();
        setClasses(list);
      } catch (err) {
        console.error("Failed to load classes", err);
        setError("Failed to load classes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaChalkboardTeacher className="w-6 h-6" /> Manage Online Classes
        </h1>
        <Link
          href="/dashboard/admin/online-classes/create"
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition duration-200 flex items-center gap-2"
        >
          <FaPlus className="w-4 h-4" /> Create New Class
        </Link>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <AdminClassesTable classes={classes} loading={loading} />
    </div>
  );
}

AdminOnlineClassesPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};


const ProtectedAdminOnlineClassesPage = withAuthProtection(
  AdminOnlineClassesPage,
  ["admin", "superadmin", "instructor"]
);

ProtectedAdminOnlineClassesPage.getLayout = AdminOnlineClassesPage.getLayout;

export default ProtectedAdminOnlineClassesPage;


