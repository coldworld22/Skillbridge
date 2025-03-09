import React from "react";

const AttendanceTracker = ({ liveClassId }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-yellow-400">📌 Attendance Tracker</h2>
      <p className="text-gray-300">Tracking attendance for Class ID: {liveClassId}</p>
      <ul className="mt-2 text-white">
        <li>✅ John Doe - Present</li>
        <li>✅ Alice Smith - Present</li>
        <li>❌ Bob Johnson - Absent</li>
      </ul>
    </div>
  );
};

export default AttendanceTracker; // ✅ Ensure correct export
