import { useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { FaSearch, FaEye, FaEnvelope, FaTrash, FaDownload } from "react-icons/fa";

const initialStudents = [
  {
    id: 1,
    name: "Sara Ali",
    email: "sara@example.com",
    classId: "cls1",
    classTitle: "React Basics",
    progress: 85,
    photo: "https://i.pravatar.cc/100?img=5",
    attendance: ["2025-05-01", "2025-05-03"],
    assignments: [
      { title: "Intro Quiz", grade: "A" },
      { title: "Component Project", grade: "B+" },
    ],
    activityLog: [
      { date: "2025-05-01", action: "Joined class" },
      { date: "2025-05-02", action: "Submitted Intro Quiz" },
      { date: "2025-05-03", action: "Attended class" },
    ],
  },
  {
    id: 2,
    name: "Omar Nasser",
    email: "omar@example.com",
    classId: "cls2",
    classTitle: "Next.js Bootcamp",
    progress: 60,
    photo: "https://i.pravatar.cc/100?img=8",
    attendance: ["2025-05-02"],
    assignments: [
      { title: "Dynamic Routing", grade: "B" },
    ],
    activityLog: [
      { date: "2025-05-01", action: "Joined class" },
      { date: "2025-05-02", action: "Submitted Assignment" },
    ],
  },
  {
    id: 3,
    name: "Layla Zain",
    email: "layla@example.com",
    classId: "cls1",
    classTitle: "React Basics",
    progress: 100,
    photo: "https://i.pravatar.cc/100?img=15",
    attendance: ["2025-05-01", "2025-05-03", "2025-05-05"],
    assignments: [
      { title: "Final Project", grade: "A+" },
    ],
    activityLog: [
      { date: "2025-05-01", action: "Joined class" },
      { date: "2025-05-03", action: "Attended session" },
      { date: "2025-05-05", action: "Completed project" },
    ],
  },
  {
    id: 4,
    name: "Yousef Mansour",
    email: "yousef@example.com",
    classId: "cls3",
    classTitle: "Node.js Fundamentals",
    progress: 45,
    photo: "https://i.pravatar.cc/100?img=20",
    attendance: ["2025-05-04"],
    assignments: [
      { title: "APIs Homework", grade: "B-" },
    ],
    activityLog: [
      { date: "2025-05-04", action: "Joined class" },
    ],
  },
];

export default function InstructorStudentsPage() {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState(initialStudents);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === "all" || student.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleDownload = (student) => {
    const content = `Name: ${student.name}\nEmail: ${student.email}\nClass: ${student.classTitle}\nProgress: ${student.progress}%\n\nAttendance:\n${student.attendance.join("\n")}\n\nAssignments:\n${student.assignments.map(a => `${a.title}: ${a.grade}`).join("\n")}\n\nActivity Log:\n${student.activityLog?.map(log => `${log.date}: ${log.action}`).join("\n")}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${student.name.replace(/\s+/g, '_')}_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemove = (id) => {
    if (window.confirm("Are you sure you want to remove this student?")) {
      setStudents(prev => prev.filter(s => s.id !== id));
      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
      }
    }
  };

  return (
    <InstructorLayout>
      <div className="p-6 space-y-6 text-gray-800">
        <h1 className="text-2xl font-bold">👨‍🎓 Enrolled Students</h1>

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search by name or email"
            className="border border-gray-300 px-4 py-2 rounded-md shadow-sm w-full focus:outline-none focus:ring focus:ring-yellow-400"
          />

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md shadow-sm text-sm bg-white text-gray-800"
          >
            <option value="all">All Classes</option>
            {[...new Set(initialStudents.map(s => ({ id: s.classId, title: s.classTitle })))]
              .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
              .map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider sticky top-0 z-10">
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Progress</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, idx) => (
                <tr key={student.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} border-b hover:bg-yellow-50 transition`}>
                  <td className="p-3 flex items-center gap-3">
                    <img src={student.photo} alt={student.name} className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400" />
                    <span className="font-medium">{student.name}</span>
                  </td>
                  <td className="p-3">{student.email}</td>
                  <td className="p-3">{student.classTitle}</td>
                  <td className="p-3 font-medium text-gray-700">{student.progress}%</td>
                  <td className="p-3 flex gap-2 flex-wrap text-xs">
                    <button onClick={() => setSelectedStudent(student)} className="inline-flex items-center gap-1 px-2 py-1 border border-sky-500 text-sky-600 hover:bg-sky-50 rounded-md transition" title="View">
                      <FaEye className="text-sm" /> View
                    </button>
                    <button onClick={() => window.location.href = '/messages'} className="inline-flex items-center gap-1 px-2 py-1 border border-green-500 text-green-600 hover:bg-green-50 rounded-md transition" title="Message">
                      <FaEnvelope className="text-sm" /> Message
                    </button>
                    <button onClick={() => handleRemove(student.id)} className="inline-flex items-center gap-1 px-2 py-1 border border-red-500 text-red-600 hover:bg-red-50 rounded-md transition" title="Remove">
                      <FaTrash className="text-sm" /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-16 h-16 rounded-full object-cover border-4 border-yellow-400" />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedStudent.name}</h2>
                  <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">🎓 Class Info</h3>
                  <p><strong>Class:</strong> {selectedStudent.classTitle}</p>
                  <p><strong>Progress:</strong> {selectedStudent.progress}%</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">🗓 Attendance</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedStudent.attendance.map((date, idx) => (
                      <li key={idx}>{date}</li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-800 mt-4 mb-2">📚 Assignments</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedStudent.assignments.map((a, idx) => (
                      <li key={idx}>{a.title} - Grade: {a.grade}</li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-800 mt-4 mb-2">🕓 Activity Timeline</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedStudent.activityLog?.map((log, idx) => (
                      <li key={idx}>{log.date}: {log.action}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => handleDownload(selectedStudent)} className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded text-black flex items-center gap-2 text-sm">
                  <FaDownload className="text-sm" /> Download
                </button>
                <button onClick={() => setSelectedStudent(null)} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm">Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </InstructorLayout>
  );
}
