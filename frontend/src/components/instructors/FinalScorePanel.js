import { useEffect, useState } from "react";
import {
  fetchClassScores,
  issueClassCertificate,
} from "@/services/classScoreService";

export default function FinalScorePanel({ classId }) {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    if (!classId) return;
    fetchClassScores(classId)
      .then(setScores)
      .catch((err) => {
        console.error("Failed to load scores", err);
      });
  }, [classId]);

  const handleIssue = async (studentId) => {
    try {
      await issueClassCertificate(classId, studentId);
      setScores((prev) =>
        prev.map((s) =>
          s.student_id === studentId ? { ...s, certificate_issued: true } : s
        )
      );
    } catch (err) {
      console.error("Failed to issue certificate", err);
      alert("Failed to issue certificate");
    }
  };

  if (scores.length === 0) {
    return <p className="text-sm text-gray-400">No scores available.</p>;
  }

  return (
    <div className="text-sm text-white space-y-3">
      {scores.map((s) => (
        <div
          key={s.student_id}
          className="flex justify-between items-center bg-gray-700 p-3 rounded"
        >
          <div>
            <p className="font-medium">{s.full_name || s.student_id}</p>
            <p className="text-xs text-gray-300">
              Assign: {s.assignment_score} | Attend: {s.attendance_score}% | Total:
              {" "}
              {s.total_score}
            </p>
            <p className="text-xs">
              {s.passed ? "✅ Passed" : "❌ Failed"}
            </p>
          </div>
          {s.passed && !s.certificate_issued && (
            <button
              onClick={() => handleIssue(s.student_id)}
              className="px-3 py-1 bg-yellow-500 text-black text-xs rounded"
            >
              Issue Certificate
            </button>
          )}
          {s.certificate_issued && (
            <span className="text-green-400 text-xs font-semibold">
              Certificate Issued
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
