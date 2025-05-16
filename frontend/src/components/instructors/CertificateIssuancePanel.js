// CertificateIssuancePanel.js
import { useState, useEffect } from "react";

export default function CertificateIssuancePanel({ classId }) {
  const [canIssue, setCanIssue] = useState(false);

  useEffect(() => {
    async function checkEligibility() {
      // 👇 Here you fetch from API or mock data for now
      const studentProgress = await fetch(`/api/progress/${classId}`).then(res => res.json());

      // Example:
      // studentProgress = { attendanceComplete: true, assignmentsComplete: true }

      if (studentProgress.attendanceComplete && studentProgress.assignmentsComplete) {
        setCanIssue(true);
      }
    }

    checkEligibility();
  }, [classId]);

  const handleIssueCertificate = () => {
    // Call backend API to issue certificate
    alert("✅ Certificate Issued Successfully!");
  };

  return (
    <div>
      {canIssue ? (
        <button
          onClick={handleIssueCertificate}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg"
        >
          🎓 Issue Certificate
        </button>
      ) : (
        <p className="text-sm text-gray-400">Student must complete all lessons and assignments to issue a certificate.</p>
      )}
    </div>
  );
}
