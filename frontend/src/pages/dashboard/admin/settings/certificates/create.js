import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";
import CertificatePreviewModal from "@/components/admin/certificates/CertificatePreviewModal";
import { FaSave, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";

export default function CreateCertificateTemplate() {
  const [form, setForm] = useState({
    name: "",
    type: "Completion",
    borderColor: "#FACC15",
    fontFamily: "Georgia, serif",
    titleFont: "'Great Vibes', cursive",
    showQR: true,
    logo: null,
    background: null,
  });

  const [logoPreview, setLogoPreview] = useState("/images/certificate/logo.png");
  const [bgPreview, setBgPreview] = useState("/images/paper-texture.png");
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "logo") {
      setLogoPreview(url);
      handleChange("logo", file);
    } else {
      setBgPreview(url);
      handleChange("background", file);
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Template name is required.");
      return;
    }

    toast.success("Template saved (mock)");
    console.log("Submitting", form);
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
                  value={form.fontFamily}
                  onChange={(e) => handleChange("fontFamily", e.target.value)}
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
                  value={form.titleFont}
                  onChange={(e) => handleChange("titleFont", e.target.value)}
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
                  value={form.borderColor}
                  onChange={(e) => handleChange("borderColor", e.target.value)}
                  className="w-12 h-12 border rounded-md cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.showQR}
                  onChange={(e) => handleChange("showQR", e.target.checked)}
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
            >
              <FaSave /> Save 
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
