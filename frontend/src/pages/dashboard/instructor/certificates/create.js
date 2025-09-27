// pages/dashboard/instructor/certificates/create.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import {
  fetchClassStudents,
  issueCertificate,
} from "@/services/instructor/certificateService";
import { getTemplates } from "@/services/admin/certificateTemplateService";

export default function IssueCertificatePage() {
  const router = useRouter();
  const { classId } = router.query;

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [studentName, setStudentName] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!classId) return;
      setLoading(true);
      setError("");
      try {
        const data = await fetchClassStudents(classId);
        setStudents(data?.students || []);
        setCourseTitle(data?.classTitle || "");
        setIssueDate(new Date().toISOString().slice(0, 10));
      } catch (err) {
        console.error('Failed to load class info', err);
        setError("Failed to load class info");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId]);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const data = await getTemplates();
        setTemplates(data);
        if (data?.length) {
          setSelectedTemplate(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load templates", err);
        setError("Failed to load templates");
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  const handleSubmit = async () => {
    if (!selectedStudent || !studentName) {
      alert("⚠️ Please select a student and ensure the name is filled.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await issueCertificate({
        classId,
        studentId: selectedStudent,
        studentName,
        issueDate,
        templateId: selectedTemplate || null,
      });
      router.push(`/dashboard/instructor/certificates`);
    } catch (err) {
      console.error('Issue failed', err);
      setError("Failed to issue certificate");
    } finally {
      setSaving(false);
    }
  };

  if (!classId || loading) return <div className="text-white p-10">Loading class info...</div>;

  return (
    <InstructorLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-8">🎓 Issue Certificate</h1>

        <div className="space-y-6 max-w-xl">
          {error && <p className="text-red-500">{error}</p>}
          <select
            value={selectedStudent}
            onChange={(e) => {
              const studentId = e.target.value;
              setSelectedStudent(studentId);
              const student = students.find((s) => s.id === studentId);
              setStudentName(student ? student.name : "");
            }}
            className="w-full p-3 bg-gray-100 rounded-md"
          >
            <option value="">Select Student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Student Name"
            className="w-full p-3 bg-gray-100 rounded-md"
          />

          <input
            type="text"
            value={courseTitle}
            disabled
            className="w-full p-3 bg-gray-200 rounded-md"
          />

          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="w-full p-3 bg-gray-100 rounded-md"
          />

          <label className="block text-sm font-semibold text-gray-600">
            Certificate Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full p-3 bg-gray-100 rounded-md"
            disabled={loadingTemplates || templates.length === 0}
          >
            {loadingTemplates ? (
              <option>Loading templates...</option>
            ) : templates.length === 0 ? (
              <option value="">No templates available</option>
            ) : (
              templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))
            )}
          </select>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full mt-6 disabled:opacity-50"
          >
            {saving ? 'Issuing...' : '📤 Issue Certificate'}
          </button>
        </div>
      </div>
    </InstructorLayout>
  );
}
