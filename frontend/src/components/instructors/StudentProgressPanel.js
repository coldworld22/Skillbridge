// components/instructors/StudentProgressPanel.js
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchClassScores,
  issueClassCertificate,
} from "@/services/classScoreService";

export default function StudentProgressPanel({ classId }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        const list = await fetchClassScores(classId);
        const formatted = list.map((s) => ({
          id: s.student_id,
          name: s.full_name || s.student_id,
          attendancePercentage: s.attendance_score,
          assignmentsCompleted: s.assignment_score > 0,
          grade: s.total_score,
          certificateIssued: Boolean(s.certificate_issued),
        }));
        setStudents(formatted);
      } catch (err) {
        console.error("Failed to load progress", err);
      }
    };
    load();
  }, [classId]);

  const handleIssueCertificate = async (studentId) => {
    try {
      await issueClassCertificate(classId, studentId);
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId ? { ...s, certificateIssued: true } : s
        )
      );
    } catch (err) {
      console.error("Failed to issue certificate", err);
      alert("Failed to issue certificate");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse border border-gray-700">
        <thead>
          <tr className="bg-gray-800 text-yellow-300">
            <th className="border p-3">Student</th>
            <th className="border p-3">Attendance</th>
            <th className="border p-3">Assignments</th>
            <th className="border p-3">Grade</th>
            <th className="border p-3">Certificate</th>
            <th className="border p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="bg-gray-900 text-white">
              <td className="border p-3">{student.name}</td>
              <td className="border p-3">{student.attendancePercentage}%</td>
              <td className="border p-3">
                {student.assignmentsCompleted ? "✅ Completed" : "❌ Incomplete"}
              </td>
              <td className="border p-3">{student.grade}</td>
              <td className="border p-3">
                {student.certificateIssued ? "🎓 Issued" : "⏳ Pending"}
              </td>
              <td className="border p-3 space-x-2">
                {/* View Progress */}
                <Link href={`/dashboard/instructor/student/${student.id}`}>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">
                    View
                  </button>
                </Link>
                
                {/* Issue Certificate */}
                {student.attendancePercentage === 100 && student.assignmentsCompleted && !student.certificateIssued && (
                  <button
                    onClick={() => handleIssueCertificate(student.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Issue
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
