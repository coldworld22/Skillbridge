import { FaTimes } from "react-icons/fa";
import CertificateTemplateRenderer from "@/components/certificates/CertificateTemplateRenderer";
import styles from "./CertificatePreviewModal.module.scss";

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
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <button
          onClick={onClose}
          className={styles.close}
          aria-label="Close preview"
        >
          <FaTimes size={20} />
        </button>

        <CertificateTemplateRenderer template={template} data={previewData} />
      </div>
    </div>
  );
}
