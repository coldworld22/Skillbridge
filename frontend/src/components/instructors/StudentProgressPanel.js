// components/instructors/StudentProgressPanel.js
import { useEffect, useState } from "react";
import Link from "next/link";

export default function StudentProgressPanel({ classId }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    async function fetchProgress() {
      // Replace with real API
      const mockData = [
        {
          id: "stu1",
          name: "Ahmed Mohamed",
          attendancePercentage: 100,
          assignmentsCompleted: true,
          grade: "95%",
          certificateIssued: false,
        },
        {
          id: "stu2",
          name: "Sara Ali",
          attendancePercentage: 90,
          assignmentsCompleted: false,
          grade: "87%",
          certificateIssued: false,
        },
      ];
      setStudents(mockData);
    }

    fetchProgress();
  }, [classId]);

  const handleIssueCertificate = (studentId) => {
    alert(`✅ Certificate Issued for Student ID: ${studentId}`);
    // TODO: Call API to actually issue the certificate
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
