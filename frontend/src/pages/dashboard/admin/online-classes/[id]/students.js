// pages/dashboard/admin/online-classes/[id]/students/[studentId].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";

export default function ManageStudentInClassPage() {
  const { id, studentId } = useRouter().query;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !studentId) return;
    async function fetchStudent() {
      try {
        const res = await fetch(`/api/classes/${id}/students/${studentId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setStudent(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [id, studentId]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!student) {
    return <div className="p-6">Student not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        🧑‍🎓 Student Overview: {student.name}
      </h1>
      <div className="bg-white shadow rounded-xl p-6 border space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p><strong>Name:</strong> {student.name}</p>
            <p><strong>Email:</strong> {student.email}</p>
            <p><strong>Status:</strong> {student.status}</p>
          </div>
          <div>
            <p><strong>Certificate:</strong> {student.certificateIssued ? "✅ Issued" : "❌ Not Issued"}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">📚 Lesson Progress</h2>
          <ul className="space-y-2">
            {student.lessons.map((lesson, i) => (
              <li key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                <span>{lesson.title}</span>
                <span className="text-sm">
                  {lesson.completed ? "✅ Completed" : "⏳ In Progress"} — Test: {lesson.testScore ?? "N/A"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">📅 Attendance</h2>
          <ul className="space-y-2">
            {student.attendance.map((record, i) => (
              <li key={i} className="flex justify-between items-center text-sm bg-gray-100 p-2 rounded">
                <span>{record.lesson}</span>
                <span>{record.attended ? "✔ Present" : "— Absent"}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">📝 Notes</h2>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {student.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>

        <div className="pt-4 flex gap-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            🎓 Issue Certificate
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            ➕ Add Note
          </button>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-sm">
            ✏️ Edit Attendance
          </button>
        </div>
      </div>
    </div>
  );
}

ManageStudentInClassPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
