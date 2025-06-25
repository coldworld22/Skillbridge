// components/instructor/StudentAttendancePanel.js
import { useState, useEffect } from "react";
import {
  fetchClassAttendance,
  updateClassAttendance,
} from "@/services/instructor/classAttendanceService";

export default function StudentAttendancePanel({ classId }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        const list = await fetchClassAttendance(classId);
        setStudents(list);
      } catch (err) {
        console.error("Failed to load attendance", err);
      }
    };
    load();
  }, [classId]);

  const toggleAttendance = async (index) => {
    const student = students[index];
    const attended = !student.attended;
    try {
      await updateClassAttendance(classId, student.user_id, attended);
      const updated = [...students];
      updated[index].attended = attended;
      setStudents(updated);
    } catch (err) {
      console.error("Failed to update attendance", err);
    }
  };

  return (
    <div className="text-sm text-white space-y-3">
      {students.map((student, i) => (
        <div
          key={i}
          className="flex justify-between items-center bg-gray-700 p-3 rounded"
        >
          <span>{student.full_name}</span>
          <button
            onClick={() => toggleAttendance(i)}
            className={`px-3 py-1 text-xs rounded font-semibold ${
              student.attended
                ? "bg-green-500 text-black"
                : "bg-gray-500 text-white"
            }`}
          >
            {student.attended ? "Present" : "Absent"}
          </button>
        </div>
      ))}
    </div>
  );
}
