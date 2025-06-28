import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchClassStudents } from "@/services/admin/classService";

export default function ClassStudentsPage() {
  const { id } = useRouter().query;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const list = await fetchClassStudents(id);
        setStudents(list);
      } catch (err) {
        console.error(err);
        setError("Failed to load students");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Enrolled Students</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : students.length === 0 ? (
        <p>No students enrolled.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((stu) => (
                <tr key={stu.id} className="bg-white">
                  <td className="border p-2">{stu.full_name}</td>
                  <td className="border p-2">{stu.email}</td>
                  <td className="border p-2 text-center">{stu.status}</td>
                  <td className="border p-2 text-center">
                    <Link
                      href={`/dashboard/admin/online-classes/${id}/students/${stu.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

ClassStudentsPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
