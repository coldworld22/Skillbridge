// components/instructors/StudentProgressPanel.js
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  fetchClassScores,
  issueClassCertificate,
} from "@/services/classScoreService";
import { fetchClassStudents } from "@/services/instructor/studentService";

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return value;
  }
};

const formatScore = (value, suffix = "%") => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value}${suffix}`;
};

export default function StudentProgressPanel({ classId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rosterError, setRosterError] = useState(null);
  const [scoreError, setScoreError] = useState(null);
  const [issuing, setIssuing] = useState(null);

  useEffect(() => {
    if (!classId) return;
    let active = true;
    setLoading(true);
    setRosterError(null);
    setScoreError(null);

    Promise.allSettled([
      fetchClassStudents(classId),
      fetchClassScores(classId),
    ])
      .then(([rosterRes, scoreRes]) => {
        if (!active) return;
        const roster =
          rosterRes.status === "fulfilled" ? rosterRes.value ?? [] : [];
        const scores =
          scoreRes.status === "fulfilled" ? scoreRes.value ?? [] : [];

        if (rosterRes.status === "rejected") {
          console.error("Failed to load class roster", rosterRes.reason);
          setRosterError("Unable to load enrolled students");
        }

        if (scoreRes.status === "rejected") {
          console.error("Failed to load student scores", scoreRes.reason);
          setScoreError("Score breakdown unavailable");
        }

        const scoreMap = new Map(
          scores.map((entry) => [entry.student_id, entry]),
        );

        const merged = roster.map((student) => {
          const score = scoreMap.get(student.id) || {};
          return {
            id: student.id,
            name: student.full_name || student.email || "Unnamed student",
            status: student.status || "enrolled",
            enrolledAt: student.enrolled_at,
            attendancePercentage:
              typeof score.attendance_score === "number"
                ? Math.round(score.attendance_score)
                : null,
            assignmentsCompleted: Number(score.assignment_score || 0) > 0,
            grade:
              typeof score.total_score === "number"
                ? Math.round(score.total_score)
                : null,
            certificateIssued: Boolean(score.certificate_issued),
          };
        });

        const extraScores = scores
          .filter(
            (score) =>
              !merged.find((student) => student.id === score.student_id),
          )
          .map((score) => ({
            id: score.student_id,
            name: score.full_name || score.student_id,
            status: "enrolled",
            enrolledAt: null,
            attendancePercentage:
              typeof score.attendance_score === "number"
                ? Math.round(score.attendance_score)
                : null,
            assignmentsCompleted: Number(score.assignment_score || 0) > 0,
            grade:
              typeof score.total_score === "number"
                ? Math.round(score.total_score)
                : null,
            certificateIssued: Boolean(score.certificate_issued),
          }));

        setStudents([...merged, ...extraScores]);
      })
      .catch((err) => {
        console.error("Failed to load students tab", err);
        setRosterError("Unable to load students");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [classId]);

  const totalEnrolled = students.length;
  const certificatesIssued = useMemo(
    () => students.filter((s) => s.certificateIssued).length,
    [students],
  );

  const handleIssueCertificate = async (studentId) => {
    if (!classId || !studentId) return;
    setIssuing(studentId);
    try {
      await issueClassCertificate(classId, studentId);
      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId
            ? { ...student, certificateIssued: true }
            : student,
        ),
      );
    } catch (err) {
      console.error("Failed to issue certificate", err);
      alert("Unable to issue certificate for this student at the moment.");
    } finally {
      setIssuing(null);
    }
  };

  const canIssueCertificate = (student) =>
    !student.certificateIssued &&
    typeof student.attendancePercentage === "number" &&
    student.attendancePercentage >= 90 &&
    student.assignmentsCompleted;

  if (!classId) {
    return <p className="text-sm text-gray-400">Select a class to continue.</p>;
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-1/3 animate-pulse rounded bg-gray-800" />
        <div className="h-24 animate-pulse rounded bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
          <p className="text-gray-400">Enrolled students</p>
          <p className="text-2xl font-semibold text-white">{totalEnrolled}</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
          <p className="text-gray-400">Certificates issued</p>
          <p className="text-2xl font-semibold text-white">
            {certificatesIssued}
          </p>
        </div>
        {scoreError && (
          <div className="rounded-lg border border-amber-600/40 bg-amber-500/10 p-4 text-amber-200">
            {scoreError}
          </div>
        )}
      </div>

      {rosterError && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {rosterError}
        </div>
      )}

      {students.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 text-center text-sm text-gray-400">
          No students enrolled yet. As soon as learners join this class, their
          progress will appear here automatically.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-700 text-sm">
            <thead>
              <tr className="bg-gray-800 text-yellow-300">
                <th className="border border-gray-700 px-3 py-2 text-left">
                  Student
                </th>
                <th className="border border-gray-700 px-3 py-2">Status</th>
                <th className="border border-gray-700 px-3 py-2">
                  Enrolled
                </th>
                <th className="border border-gray-700 px-3 py-2">
                  Attendance
                </th>
                <th className="border border-gray-700 px-3 py-2">
                  Assignments
                </th>
                <th className="border border-gray-700 px-3 py-2">Grade</th>
                <th className="border border-gray-700 px-3 py-2">
                  Certificate
                </th>
                <th className="border border-gray-700 px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="bg-gray-900 text-white odd:bg-gray-900 even:bg-gray-950"
                >
                  <td className="border border-gray-800 px-3 py-2 font-semibold">
                    {student.name}
                  </td>
                  <td className="border border-gray-800 px-3 py-2 capitalize text-gray-300">
                    {student.status}
                  </td>
                  <td className="border border-gray-800 px-3 py-2 text-gray-300">
                    {formatDate(student.enrolledAt)}
                  </td>
                  <td className="border border-gray-800 px-3 py-2">
                    {formatScore(student.attendancePercentage)}
                  </td>
                  <td className="border border-gray-800 px-3 py-2">
                    {student.assignmentsCompleted ? "✅ Complete" : "—"}
                  </td>
                  <td className="border border-gray-800 px-3 py-2">
                    {formatScore(student.grade, "/100")}
                  </td>
                  <td className="border border-gray-800 px-3 py-2">
                    {student.certificateIssued ? "🎓 Issued" : "⏳ Pending"}
                  </td>
                  <td className="border border-gray-800 px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/instructor/student/${student.id}?classId=${encodeURIComponent(
                          classId ?? "",
                        )}`}
                        className="rounded bg-blue-500 px-3 py-1 text-white transition hover:bg-blue-600"
                      >
                        View
                      </Link>
                      {canIssueCertificate(student) && (
                        <button
                          type="button"
                          disabled={issuing === student.id}
                          onClick={() => handleIssueCertificate(student.id)}
                          className="rounded bg-green-500 px-3 py-1 text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {issuing === student.id ? "Issuing…" : "Issue"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
