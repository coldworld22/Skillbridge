import { useEffect, useState } from "react";
import { fetchMyClassScore } from "@/services/classScoreService";

export default function StudentScoreSummary({ classId }) {
  const [score, setScore] = useState(null);

  useEffect(() => {
    if (!classId) return;
    fetchMyClassScore(classId)
      .then(setScore)
      .catch((err) => {
        console.error("Failed to load score", err);
      });
  }, [classId]);

  if (!score) {
    return <p className="text-sm text-gray-400">Score not available.</p>;
  }

  return (
    <div className="text-sm text-white space-y-1">
      <p>Assignment Score: {score.assignment_score}</p>
      <p>Attendance: {score.attendance_score}%</p>
      <p className="font-semibold">Total: {score.total_score}</p>
      <p>{score.passed ? "✅ Passed" : "❌ Failed"}</p>
      {score.certificate_issued && (
        <a
          href={`/dashboard/student/certificates/view/${score.certificate_id}`}
          className="text-yellow-400 underline text-xs"
        >
          View Certificate
        </a>
      )}
    </div>
  );
}
