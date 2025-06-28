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
        <div className="bg-green-700 text-white p-3 rounded text-sm flex items-center justify-between">
          <span>🎉 Certificate is now ready!</span>
          <button onClick={handleIssueCertificate} className="underline font-semibold">Download</button>
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          Student must complete all lessons and assignments to issue a certificate.
        </p>
      )}
    </div>
  );
}
