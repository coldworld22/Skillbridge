// pages/dashboard/instructor/certificates/create.js
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchInstructorClasses } from "@/services/instructor/classService";
import {
  fetchClassStudents,
  issueCertificate,
} from "@/services/instructor/certificateService";

const defaultPlatformName =
  process.env.NEXT_PUBLIC_APP_NAME ||
  process.env.NEXT_PUBLIC_BRAND_NAME ||
  "SkillBridge";

export default function IssueCertificatePage() {
  const router = useRouter();
  const { classId: routerClassId } = router.query;

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [platformName, setPlatformName] = useState(defaultPlatformName);
  const [instructorName, setInstructorName] = useState("");
  const [grade, setGrade] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let alive = true;
    const loadClasses = async () => {
      setLoadingClasses(true);
      try {
        const data = await fetchInstructorClasses();
        if (alive) {
          setClasses(data || []);
          if (routerClassId) {
            setSelectedClassId(String(routerClassId));
          }
        }
      } catch (err) {
        console.error("Failed to load classes", err);
        toast.error("Unable to load classes. Please refresh.");
      } finally {
        if (alive) setLoadingClasses(false);
      }
    };
    loadClasses();
    return () => {
      alive = false;
    };
  }, [routerClassId]);

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setSelectedStudentId("");
      setStudentName("");
      return;
    }
    let alive = true;
    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const list = await fetchClassStudents(selectedClassId);
        if (alive) {
          setStudents(list || []);
        }
      } catch (err) {
        console.error("Failed to load students", err);
        toast.error("Could not load enrolled students.");
        if (alive) setStudents([]);
      } finally {
        if (alive) setLoadingStudents(false);
      }
    };
    loadStudents();
    return () => {
      alive = false;
    };
  }, [selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((cls) => String(cls.id) === String(selectedClassId)),
    [classes, selectedClassId],
  );

  const selectedStudent = useMemo(
    () =>
      students.find((student) => String(student.id) === String(selectedStudentId)),
    [students, selectedStudentId],
  );

  useEffect(() => {
    if (selectedStudent) {
      setStudentName(selectedStudent.full_name || "");
    } else if (!selectedStudentId) {
      setStudentName("");
    }
  }, [selectedStudent, selectedStudentId]);

  const validate = () => {
    const nextErrors = {};
    if (!selectedClassId) nextErrors.classId = "Please select a class.";
    if (!selectedStudentId) nextErrors.studentId = "Select a student.";
    if (!studentName.trim()) nextErrors.studentName = "Recipient name is required.";
    if (!issueDate) nextErrors.issueDate = "Issue date is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      await issueCertificate({
        classId: selectedClassId,
        studentId: selectedStudentId,
        studentName: studentName.trim(),
        issueDate,
        platformName: platformName.trim(),
        instructorName: instructorName.trim(),
        grade: grade.trim(),
        verificationUrl: verificationUrl.trim(),
      });
      toast.success("Certificate issued.");
      router.push("/dashboard/instructor/certificates");
    } catch (err) {
      console.error("Failed to issue certificate", err);
      toast.error("Failed to issue certificate. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <InstructorLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-2xl font-bold text-yellow-500">
            🎓 Issue a certificate
          </h1>
          <p className="text-sm text-gray-500">
            Choose a class, confirm the student details, and we&apos;ll handle the
            template preview for you.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Select class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={loadingClasses || !!routerClassId}
                className={`w-full p-3 bg-gray-50 border rounded-md ${
                  errors.classId ? "border-red-400" : "border-gray-200"
                }`}
              >
                <option value="">
                  {loadingClasses ? "Loading classes..." : "Choose a class"}
                </option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.title}
                  </option>
                ))}
              </select>
              {errors.classId && (
                <p className="text-sm text-red-500 mt-1">{errors.classId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Student
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={!selectedClassId || loadingStudents}
                className={`w-full p-3 bg-gray-50 border rounded-md ${
                  errors.studentId ? "border-red-400" : "border-gray-200"
                }`}
              >
                <option value="">
                  {!selectedClassId
                    ? "Select a class first"
                    : loadingStudents
                    ? "Loading students..."
                    : students.length === 0
                    ? "No enrolled students yet"
                    : "Choose a student"}
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.status})
                  </option>
                ))}
              </select>
              {errors.studentId && (
                <p className="text-sm text-red-500 mt-1">{errors.studentId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Recipient name (editable)
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className={`w-full p-3 bg-gray-50 border rounded-md ${
                  errors.studentName ? "border-red-400" : "border-gray-200"
                }`}
                placeholder="Exactly how the name should appear on the certificate"
              />
              {errors.studentName && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.studentName}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Issue date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className={`w-full p-3 bg-gray-50 border rounded-md ${
                    errors.issueDate ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {errors.issueDate && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.issueDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Grade / score (optional)
                </label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-3 bg-gray-50 border rounded-md border-gray-200"
                  placeholder="e.g. 92%, A, Distinction"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Platform / academy name
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full p-3 bg-gray-50 border rounded-md border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Instructor signature name
                </label>
                <input
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  className="w-full p-3 bg-gray-50 border rounded-md border-gray-200"
                  placeholder="Optional override"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Verification URL (optional)
              </label>
              <input
                type="url"
                value={verificationUrl}
                onChange={(e) => setVerificationUrl(e.target.value)}
                className="w-full p-3 bg-gray-50 border rounded-md border-gray-200"
                placeholder="https://yourdomain.com/certificate/verify/XYZ"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard/instructor/certificates")}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-full"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !students.length}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full disabled:opacity-60"
              >
                {saving ? "Issuing..." : "📤 Issue certificate"}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 h-fit">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              At a glance
            </h2>
            <dl className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Class</dt>
                <dd>{selectedClass?.title || "Not selected"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Student</dt>
                <dd>{studentName || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Issue date</dt>
                <dd>{issueDate || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Grade</dt>
                <dd>{grade || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Platform</dt>
                <dd>{platformName || "—"}</dd>
              </div>
            </dl>
            <p className="text-xs text-gray-500 mt-6">
              Students automatically see issued certificates inside their
              dashboard. Revoking is always possible from the certificates list.
            </p>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}
