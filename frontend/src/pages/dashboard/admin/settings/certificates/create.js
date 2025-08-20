import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";
import CertificatePreviewModal from "@/components/admin/certificates/CertificatePreviewModal";
import { FaSave, FaEye, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import { saveTemplate, uploadTemplateFile } from "@/services/admin/certificateTemplateService";
import { useRouter } from "next/router";

const CERTIFICATE_TYPES = ["Completion", "Achievement", "Attendance"];
const FONT_FAMILIES = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
];
const TITLE_FONTS = [
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Pacifico", value: "'Pacifico', cursive" },
];

export default function CreateCertificateTemplate() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    type: CERTIFICATE_TYPES[0],
    border_color: "#FACC15",
    font_family: FONT_FAMILIES[0].value,
    title_font: TITLE_FONTS[0].value,
    show_qr: true,
    logo: null,
    background: null,
  });

  const [logoPreview, setLogoPreview] = useState("/images/certificate/logo.png");
  const [bgPreview, setBgPreview] = useState("/images/paper-texture.png");
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    if (!form.name.trim()) {
      toast.error("Template name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await saveTemplate(form);
      toast.success("Template saved");
      router.push("/dashboard/admin/settings/certificates");
    } catch (err) {
      console.error("Failed to save template", err);
      toast.error("Failed to save template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🎓 Create Certificate Template</h1>

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
                  {CERTIFICATE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
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
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Title Font</label>
                  <select
                    value={form.title_font}
                    onChange={(e) => handleChange("title_font", e.target.value)}
                    className="select select-bordered w-full mt-1"
                  >
                    {TITLE_FONTS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
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

          {/* Logo & Background Uploads */}
          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">🖼 Logo & Background</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Logo</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "logo")} className="file-input w-full mt-1" />
                <img src={logoPreview} alt="Logo Preview" className="mt-3 h-20 object-contain border rounded-md" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Background Texture</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "background")} className="file-input w-full mt-1" />
                <img src={bgPreview} alt="Background Preview" className="mt-3 h-20 object-cover border rounded-md" />
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
              className="btn bg-primary flex items-center gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FaSave /> Save
                </>
              )}
            </button>
          </section>
        </div>

        {/* Live Preview */}
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
    </AdminLayout>
  );
}
