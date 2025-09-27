import { useEffect, useMemo, useState } from "react";
import CertificatePreviewModal from "@/components/admin/certificates/CertificatePreviewModal";
import { FaSave, FaEye, FaSpinner } from "react-icons/fa";
import { uploadTemplateFile } from "@/services/admin/certificateTemplateService";
import { toast } from "react-toastify";

const buildDefaultSampleData = () => ({
  id: "ABC123",
  student_name: "Student Name",
  course_name: "Course Title",
  issue_date: new Date().toISOString().split("T")[0],
  instructor: "Instructor Name",
  platform_name: "Platform Name",
  grade: "A+",
});

export default function CertificateTemplateForm({ initialValues, onSubmit, submitText }) {
  const mergedInitialValues = useMemo(() => {
    const baseValues = initialValues || {};
    const defaultSampleData = buildDefaultSampleData();
    return {
      show_qr: true,
      ...baseValues,
      sample_data: {
        ...defaultSampleData,
        ...(baseValues.sample_data || {}),
      },
    };
  }, [initialValues]);

  const [form, setForm] = useState(mergedInitialValues);
  const [logoPreview, setLogoPreview] = useState(
    mergedInitialValues?.logo || "/images/certificate/logo.png"
  );
  const [bgPreview, setBgPreview] = useState(
    mergedInitialValues?.background || "/images/paper-texture.png"
  );
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm(mergedInitialValues);
    setLogoPreview(mergedInitialValues?.logo || "/images/certificate/logo.png");
    setBgPreview(mergedInitialValues?.background || "/images/paper-texture.png");
  }, [mergedInitialValues]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSampleDataChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      sample_data: {
        ...(prev.sample_data || {}),
        [key]: value,
      },
    }));
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadTemplateFile(file);
      if (type === "logo") {
        setLogoPreview(url);
        handleChange("logo", url);
      } else {
        setBgPreview(url);
        handleChange("background", url);
      }
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Failed to upload image");
    }
  };

  const handleSubmit = async () => {
    if (!form?.name?.trim()) {
      toast.error("Template name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-8">
      {/* General Info */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">📝 Basic Info</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Template Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="input input-bordered w-full"
          />
          <select
            value={form.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="Completion">Completion</option>
            <option value="Achievement">Achievement</option>
            <option value="Attendance">Attendance</option>
          </select>
        </div>
      </section>

      {/* Fonts */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">🔤 Fonts & Styling</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Body Font</label>
            <select
              value={form.font_family}
              onChange={(e) => handleChange("font_family", e.target.value)}
              className="select select-bordered w-full mt-1"
            >
              <option value="Georgia, serif">Georgia</option>
              <option value="Times New Roman, serif">Times New Roman</option>
              <option value="Arial, sans-serif">Arial</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Title Font</label>
            <select
              value={form.title_font}
              onChange={(e) => handleChange("title_font", e.target.value)}
              className="select select-bordered w-full mt-1"
            >
              <option value="'Great Vibes', cursive">Great Vibes</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
              <option value="'Pacifico', cursive">Pacifico</option>
            </select>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">🎨 Appearance</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Border Color</label>
            <input
              type="color"
              value={form.border_color}
              onChange={(e) => handleChange("border_color", e.target.value)}
              className="w-12 h-12 border rounded-md cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.show_qr}
              onChange={(e) => handleChange("show_qr", e.target.checked)}
              className="checkbox"
            />
            <span className="text-gray-700">Include QR Code</span>
          </div>
        </div>
      </section>

      {/* Sample Data */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">🔖 Sample Data</h2>
        <p className="text-sm text-gray-500 mb-4">
          Provide example values to preview how certificates will look. These values are
          only used for previews and can be customized per template.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Student Name"
            value={form.sample_data?.student_name ?? ""}
            onChange={(e) => handleSampleDataChange("student_name", e.target.value)}
            className="input input-bordered w-full"
          />
          <input
            type="text"
            placeholder="Course Title"
            value={form.sample_data?.course_name ?? ""}
            onChange={(e) => handleSampleDataChange("course_name", e.target.value)}
            className="input input-bordered w-full"
          />
          <input
            type="date"
            placeholder="Issue Date"
            value={(() => {
              const value = form.sample_data?.issue_date;
              if (!value) return "";
              if (typeof value === "string" && value.includes("T")) {
                return value.split("T")[0];
              }
              return value;
            })()}
            onChange={(e) => handleSampleDataChange("issue_date", e.target.value)}
            className="input input-bordered w-full"
          />
          <input
            type="text"
            placeholder="Instructor Name"
            value={form.sample_data?.instructor ?? ""}
            onChange={(e) => handleSampleDataChange("instructor", e.target.value)}
            className="input input-bordered w-full"
          />
          <input
            type="text"
            placeholder="Platform Name"
            value={form.sample_data?.platform_name ?? ""}
            onChange={(e) => handleSampleDataChange("platform_name", e.target.value)}
            className="input input-bordered w-full"
          />
          <input
            type="text"
            placeholder="Final Grade"
            value={form.sample_data?.grade ?? ""}
            onChange={(e) => handleSampleDataChange("grade", e.target.value)}
            className="input input-bordered w-full"
          />
          <input
            type="text"
            placeholder="Certificate ID"
            value={form.sample_data?.id ?? ""}
            onChange={(e) => handleSampleDataChange("id", e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
      </section>

      {/* Logo & Background Uploads */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">🖼 Logo & Background</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "logo")}
              className="file-input w-full mt-1"
            />
            <img
              src={logoPreview}
              alt="Logo Preview"
              className="mt-3 h-20 object-contain border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Background Texture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "background")}
              className="file-input w-full mt-1"
            />
            <img
              src={bgPreview}
              alt="Background Preview"
              className="mt-3 h-20 object-cover border rounded-md"
            />
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="flex justify-between items-center mt-6">
        <button
          className="btn btn-outline flex items-center gap-2"
          onClick={() => setShowPreview(true)}
        >
          <FaEye /> Preview
        </button>
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <FaSpinner className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <FaSave /> {submitText}
            </>
          )}
        </button>
      </section>

      {showPreview && (
        <CertificatePreviewModal
          template={{
            ...form,
            logo: logoPreview,
            background: bgPreview,
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

