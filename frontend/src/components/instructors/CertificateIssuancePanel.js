// CertificateIssuancePanel.js
import { useState, useEffect } from "react";
import { fetchClassScores, issueClassCertificate } from "@/services/classScoreService";

export default function CertificateIssuancePanel({ classId }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        const list = await fetchClassScores(classId);
        setStudents(list);
      } catch (err) {
        console.error("Failed to load scores", err);
      }
    };
    load();
  }, [classId]);

  const handleIssueCertificate = async (studentId) => {
    try {
      await issueClassCertificate(classId, studentId);
      setStudents((prev) =>
        prev.map((s) =>
          s.student_id === studentId ? { ...s, certificate_issued: true } : s
        )
      );
    } catch (err) {
      console.error("Failed to issue certificate", err);
      alert("Failed to issue certificate");
    }
  };

  if (students.length === 0) {
    return <p className="text-sm text-gray-400">No student scores available.</p>;
  }

  return (
    <div className="space-y-3 text-sm text-white">
      {students.map((s) => (
        <div
          key={s.student_id}
          className="flex justify-between items-center bg-gray-700 p-3 rounded"
        >
          <div>
            <p className="font-medium">{s.full_name || s.student_id}</p>
            <p className="text-xs">{s.passed ? "✅ Passed" : "❌ Failed"}</p>
          </div>
          {s.passed && !s.certificate_issued && (
            <button
              onClick={() => handleIssueCertificate(s.student_id)}
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
