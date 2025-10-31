import { FaTimes } from "react-icons/fa";
import CertificateTemplateRenderer from "@/components/certificates/CertificateTemplateRenderer";

export default function CertificatePreviewModal({ template, onClose, mockData }) {
  if (!template) return null;

  const previewData = {
    id: "ABC123",
    studentName: "Student Name",
    courseName: "Course Title",
    grade: "A+",
    ...(mockData || {}),
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/85 to-black/60 flex items-center justify-center z-50 px-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl p-6 overflow-auto border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 z-10"
        >
          <FaTimes size={20} />
        </button>

        <CertificateTemplateRenderer template={template} data={previewData} />
      </div>
    </div>
  );
}
