// pages/dashboard/student/assignments/[id].js
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import StudentLayout from "@/components/layouts/StudentLayout";
import {
  FaExclamationTriangle,
  FaPlay,
  FaUpload,
  FaBookOpen,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";
import {
  fetchStudentAssignmentDetail,
  submitStudentAssignment,
} from "@/services/student/assignmentService";

const formatDateTime = (value) => {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function AssignmentSolvePage() {
  const router = useRouter();
  const assignmentId = Array.isArray(router.query.id)
    ? router.query.id[0]
    : router.query.id;

  const [detail, setDetail] = useState({
    assignment: null,
    submission: null,
    source: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);
  const [blurCount, setBlurCount] = useState(0);
  const [file, setFile] = useState(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef(null);

  const handleBlur = useCallback(() => {
    setBlurCount((prev) => {
      const next = prev + 1;
      if (next === 1) {
        alert(
          "⚠️ Warning: Please stay focused! Switching tabs or minimizing is not allowed."
        );
      } else if (next === 2) {
        alert(
          "⚠️ Final Warning: One more distraction and the assignment will be flagged!"
        );
      } else {
        alert(
          "🚫 You have exceeded the allowed distractions. Admins will be notified."
        );
      }
      return next;
    });
  }, []);

  const enterFullscreen = () => {
    if (typeof document === "undefined") return;
    const elem = document.documentElement;
    if (elem?.requestFullscreen) elem.requestFullscreen();
  };

  useEffect(() => {
    if (!started) return undefined;
    window.addEventListener("blur", handleBlur);
    enterFullscreen();
    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [started, handleBlur]);

  const loadAssignment = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStudentAssignmentDetail(assignmentId);
      setDetail(data);
      setAnswer(data.submission?.textAnswer || "");
      setStarted(Boolean(data.submission));
      setBlurCount(0);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load assignment.";
      setError(message);
      setDetail({ assignment: null, submission: null, source: null });
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  const handleStart = () => {
    setFormError("");
    setStarted(true);
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
  };

  const assignment = detail.assignment;
  const submission = detail.submission;
  const sourceLabel =
    detail.source === "tutorial" ? "Tutorial Assignment" : "Class Assignment";

  const handleSubmit = async () => {
    if (!assignment) return;
    if (!answer.trim() && !file) {
      setFormError("Please type your answer or upload a file before submitting.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const savedSubmission = await submitStudentAssignment({
        assignmentId: assignment.id,
        source: detail.source,
        textAnswer: answer,
        file,
      });
      setDetail((prev) => ({
        ...prev,
        submission: savedSubmission,
      }));
      setAnswer(savedSubmission.textAnswer || "");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setStarted(true);
      toast.success("Assignment submitted successfully!");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit assignment.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-white px-6 py-10 text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">
          📝 Solve Assignment
        </h1>

        {loading && (
          <p className="text-center text-gray-500 mt-10">Loading assignment...</p>
        )}

        {!loading && error && (
          <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={loadAssignment}
              className="mt-3 text-sm underline font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && !assignment && (
          <p className="text-center text-gray-500 mt-10">
            This assignment is unavailable or you do not have access.
          </p>
        )}

        {!loading && !error && assignment && (
          <>
            <div className="bg-gray-100 p-6 rounded-xl shadow-md space-y-4">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-green-500" />
                <span className="text-sm font-semibold uppercase tracking-wide text-green-700">
                  {sourceLabel}
                </span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {assignment.title}
              </h2>
              <div className="flex flex-col gap-2 text-sm text-gray-700">
                {assignment.parentTitle && (
                  <p className="flex items-center gap-2">
                    <FaBookOpen className="text-gray-500" />
                    Part of: <span className="font-medium">{assignment.parentTitle}</span>
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <FaClock className="text-gray-500" />
                  Due: <span className="font-medium">{formatDateTime(assignment.dueDate)}</span>
                </p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">
                  Instructions
                </h3>
                {assignment.description ? (
                  <p className="text-gray-700 whitespace-pre-line">
                    {assignment.description}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Your instructor has not added detailed instructions for this assignment yet.
                  </p>
                )}
              </div>
            </div>

            {submission && (
              <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-lg p-5 mt-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Last submission
                </h3>
                <dl className="text-sm text-gray-700 space-y-2">
                  <div className="flex justify-between flex-wrap gap-2">
                    <dt className="font-medium">Submitted:</dt>
                    <dd>{formatDateTime(submission.submittedAt)}</dd>
                  </div>
                  <div className="flex justify-between flex-wrap gap-2">
                    <dt className="font-medium">Grade:</dt>
                    <dd>{submission.grade != null ? `${submission.grade}%` : "Pending"}</dd>
                  </div>
                  {submission.fileUrl && (
                    <div className="flex justify-between flex-wrap gap-2">
                      <dt className="font-medium">Uploaded file:</dt>
                      <dd>
                        <a
                          href={submission.fileDownloadUrl || submission.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-yellow-600 underline"
                        >
                          Download submission
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
                {submission.textAnswer && (
                  <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 whitespace-pre-line">
                    {submission.textAnswer}
                  </div>
                )}
              </div>
            )}

            {!started ? (
              <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-lg mt-6 max-w-3xl mx-auto">
                <h3 className="flex items-center gap-2 font-bold text-yellow-800 mb-3">
                  <FaExclamationTriangle /> Assignment Rules
                </h3>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  <li>No tab switching or minimizing the window.</li>
                  <li>Stay in fullscreen throughout the attempt.</li>
                  <li>External help (friends, AI tools, search engines) is not allowed.</li>
                  <li>Submit your own honest work.</li>
                </ul>
                <button
                  type="button"
                  onClick={handleStart}
                  className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-full w-full flex items-center justify-center gap-2"
                >
                  <FaPlay /> Start Assignment
                </button>
              </div>
            ) : (
              <div className="space-y-6 mt-6 max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Type your assignment answer here..."
                  className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                ></textarea>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Or upload a file (PDF, DOCX)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  {file && (
                    <p className="mt-2 text-xs text-gray-500">
                      Selected: <span className="font-medium">{file.name}</span>
                    </p>
                  )}
                </div>

                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-full flex items-center justify-center gap-2"
                >
                  <FaUpload />
                  {submitting ? "Submitting..." : "Submit Assignment"}
                </button>
              </div>
            )}

            {started && (
              <p className="mt-6 text-center text-sm text-red-500">
                Blur warnings triggered: {blurCount}
              </p>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}
