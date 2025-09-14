import { useState } from "react";
import {
  FaCertificate,
  FaFilePdf,
  FaFileImage,
  FaTrash,
  FaUpload,
  FaSpinner,
  FaPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  uploadCertificateFile,
  deleteCertificateFile,
} from "@/services/instructor/instructorService";

export default function CertificatesSection({ certificates, onChange, t, baseUrl }) {
  const [newCertificate, setNewCertificate] = useState({
    title: "",
    file: null,
    preview: null,
  });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!newCertificate.title || !newCertificate.file) {
      toast.error(t('provide_title_and_file'));
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("title", newCertificate.title);
      formData.append("file", newCertificate.file);
      const response = await uploadCertificateFile(formData);
      onChange([
        ...certificates,
        { id: response.id, title: newCertificate.title, file_url: response.file_url },
      ]);
      if (newCertificate.preview) {
        URL.revokeObjectURL(newCertificate.preview);
      }
      setNewCertificate({ title: "", file: null, preview: null });
      toast.success(t('certificate_upload_success'));
    } catch (error) {
      toast.error(t('certificate_upload_failed'));
      console.error("Certificate upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await deleteCertificateFile(id);
      onChange(certificates.filter((cert) => cert.id !== id));
      toast.success(t('certificate_removed'));
    } catch (error) {
      toast.error(t('certificate_remove_failed'));
      console.error("Certificate removal error:", error);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
        <FaCertificate className="text-gray-500" /> {t('certificates')}
      </label>

      <div className="space-y-4 mb-6">
        {certificates.map((certificate) => (
          <div
            key={certificate.id}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              {certificate.file_url.endsWith('.pdf') ? (
                <FaFilePdf className="text-red-500 text-2xl" />
              ) : (
                <FaFileImage className="text-blue-500 text-2xl" />
              )}
              <div>
                <h4 className="font-medium">{certificate.title}</h4>
                <a
                  href={`${baseUrl}${certificate.file_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t('view_certificate')}
                </a>
              </div>
            </div>
            <button
              onClick={() => handleRemove(certificate.id)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <FaPlus className="text-gray-500" /> {t('add_new_certificate')}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('certificate_title')} *
            </label>
            <input
              type="text"
              value={newCertificate.title}
              onChange={(e) =>
                setNewCertificate((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Yoga Instructor Certification"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('certificate_file')} *
            </label>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    toast.error(t('file_size_limit'));
                    return;
                  }
                  let preview = null;
                  if (file.type.startsWith('image/')) {
                    preview = URL.createObjectURL(file);
                  }
                  setNewCertificate((prev) => ({ ...prev, file, preview }));
                }}
                className="hidden"
              />
              <div className="w-full px-4 py-2 border border-gray-300 rounded-md flex items-center justify-between">
                <span className="truncate">
                  {newCertificate.file ? newCertificate.file.name : t('choose_file')}
                </span>
                <FaUpload className="text-gray-500" />
              </div>
            </label>
          </div>
        </div>

        {newCertificate.preview && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">{t('preview')}</label>
            <img
              src={newCertificate.preview}
              alt="Certificate preview"
              className="max-h-40 border rounded-md"
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!newCertificate.title || !newCertificate.file || uploading}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
          {t('upload_certificate')}
        </button>
      </div>
    </div>
  );
}
