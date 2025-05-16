// pages/dashboard/instructor/certificates/create.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import InstructorLayout from "@/components/layouts/InstructorLayout";

export default function IssueCertificatePage() {
  const router = useRouter();
  const { classId } = router.query;

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [studentName, setStudentName] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [issueDate, setIssueDate] = useState("");

  useEffect(() => {
    if (classId) {
      // Mock: Fetch enrolled students + class details
      setStudents([
        { id: "s1", name: "Ahmed Mohamed" },
        { id: "s2", name: "Sara Ali" },
      ]);
      setCourseTitle("React & Next.js Bootcamp");
      setIssueDate(new Date().toISOString().slice(0, 10));
    }
  }, [classId]);

  const handleSubmit = () => {
    if (!selectedStudent || !studentName) {
      alert("⚠️ Please select a student and ensure the name is filled.");
      return;
    }

    const newCertificate = {
      studentId: selectedStudent,
      studentName,
      courseTitle,
      instructorName: "Ayman Khalid", // Ideally from auth context
      issueDate,
      status: "Issued",
    };

    console.log("🎓 Issued Certificate:", newCertificate);

    alert("✅ Certificate issued successfully!");

    // Redirect to certificate list
    router.push(`/dashboard/instructor/certificates`);
  };

  if (!classId) return <div className="text-white p-10">Loading class info...</div>;

  return (
    <InstructorLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-8">🎓 Issue Certificate</h1>

        <div className="space-y-6 max-w-xl">
          <select
            value={selectedStudent}
            onChange={(e) => {
              const studentId = e.target.value;
              setSelectedStudent(studentId);
              const student = students.find((s) => s.id === studentId);
              setStudentName(student ? student.name : "");
            }}
            className="w-full p-3 bg-gray-100 rounded-md"
          >
            <option value="">Select Student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Student Name"
            className="w-full p-3 bg-gray-100 rounded-md"
          />

          <input
            type="text"
            value={courseTitle}
            disabled
            className="w-full p-3 bg-gray-200 rounded-md"
          />

          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="w-full p-3 bg-gray-100 rounded-md"
          />

          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full mt-6"
          >
            📤 Issue Certificate
          </button>
        </div>
      </div>
    </InstructorLayout>
  );
}
