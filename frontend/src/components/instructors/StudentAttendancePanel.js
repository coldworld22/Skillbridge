// components/instructor/StudentAttendancePanel.js
import { useState } from "react";

const mockStudents = [
  { name: "Ali Hassan", joined: true },
  { name: "Fatima Noor", joined: true },
  { name: "Sara Ali", joined: false },
];

export default function StudentAttendancePanel({ classId }) {
  const [students, setStudents] = useState(mockStudents);

  const toggleAttendance = (index) => {
    const updated = [...students];
    updated[index].joined = !updated[index].joined;
    setStudents(updated);
    // TODO: Update backend attendance later
  };

  return (
    <div className="text-sm text-white space-y-3">
      {students.map((student, i) => (
        <div
          key={i}
          className="flex justify-between items-center bg-gray-700 p-3 rounded"
        >
          <span>{student.name}</span>
          <button
            onClick={() => toggleAttendance(i)}
            className={`px-3 py-1 text-xs rounded font-semibold ${
              student.joined
                ? "bg-green-500 text-black"
                : "bg-gray-500 text-white"
            }`}
          >
            {student.joined ? "Present" : "Absent"}
          </button>
        </div>
      ))}
    </div>
  );
}
