import { useEffect, useState } from "react";
import CertificatePreviewModal from "@/components/admin/certificates/CertificatePreviewModal";
import { FaSave, FaEye, FaSpinner } from "react-icons/fa";
import { uploadTemplateFile } from "@/services/admin/certificateTemplateService";
import { toast } from "react-toastify";
import styles from "./CertificateTemplateForm.module.scss";
import { Button } from "@/components/ui/button";

export default function CertificateTemplateForm({ initialValues, onSubmit, submitText }) {
  const [form, setForm] = useState(initialValues);
  const [logoPreview, setLogoPreview] = useState(
    initialValues?.logo || "/images/certificate/logo.png"
  );
  const [bgPreview, setBgPreview] = useState(
    initialValues?.background || "/images/paper-texture.png"
  );
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!initialValues) return;
    setForm({
      ...initialValues,
      for_tutorials:
        initialValues.for_tutorials !== undefined
          ? initialValues.for_tutorials
          : true,
      for_online_classes:
        initialValues.for_online_classes !== undefined
          ? initialValues.for_online_classes
          : true,
    });
    setLogoPreview(initialValues?.logo || "/images/certificate/logo.png");
    setBgPreview(initialValues?.background || "/images/paper-texture.png");
  }, [initialValues]);

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
    if (!form.for_tutorials && !form.for_online_classes) {
      toast.error("Select at least one usage target.");
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
    <div className={styles.card}>
      {/* General Info */}
      <section className={styles.section}>
        <h2 className={styles.title}>📝 Basic Info</h2>
        <div className={styles.grid}>
          <input
            type="text"
            placeholder="Template Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={styles.input}
          />
          <select
            value={form.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className={styles.select}
          >
            <option value="Completion">Completion</option>
            <option value="Achievement">Achievement</option>
            <option value="Attendance">Attendance</option>
          </select>
        </div>
      </section>

      {/* Context */}
      <section className={styles.section}>
        <h2 className={styles.title}>🎯 Usage Targets</h2>
        <div className={styles.grid}>
          <label className={styles.checkboxCard}>
            <input
              type="checkbox"
              checked={!!form.for_tutorials}
              onChange={(e) => handleChange("for_tutorials", e.target.checked)}
              className={styles.checkboxInput}
            />
            <div>
              <p className={styles.checkboxTitle}>Tutorial Certificates</p>
              <p className={styles.checkboxDesc}>
                Enable this template for self-paced tutorials and downloadable lessons.
              </p>
            </div>
          </label>
          <label className={styles.checkboxCard}>
            <input
              type="checkbox"
              checked={!!form.for_online_classes}
              onChange={(e) =>
                handleChange("for_online_classes", e.target.checked)
              }
              className={styles.checkboxInput}
            />
            <div>
              <p className={styles.checkboxTitle}>Online Class Certificates</p>
              <p className={styles.checkboxDesc}>
                Use this design when instructors issue certificates for live cohorts.
              </p>
            </div>
          </label>
        </div>
        <p className={styles.helper}>
          Selecting targets controls where the template can be assigned as a default.
        </p>
      </section>

      {/* Fonts */}
      <section className={styles.section}>
        <h2 className={styles.title}>🔤 Fonts & Styling</h2>
        <div className={styles.grid}>
          <div>
            <label className={styles.label}>Body Font</label>
            <select
              value={form.font_family}
              onChange={(e) => handleChange("font_family", e.target.value)}
              className={styles.select}
            >
              <option value="Georgia, serif">Georgia</option>
              <option value="Times New Roman, serif">Times New Roman</option>
              <option value="Arial, sans-serif">Arial</option>
            </select>
          </div>
          <div>
            <label className={styles.label}>Title Font</label>
            <select
              value={form.title_font}
              onChange={(e) => handleChange("title_font", e.target.value)}
              className={styles.select}
            >
              <option value="'Great Vibes', cursive">Great Vibes</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
              <option value="'Pacifico', cursive">Pacifico</option>
            </select>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className={styles.section}>
        <h2 className={styles.title}>🎨 Appearance</h2>
        <div className={styles.grid}>
          <div>
            <label className={styles.label}>Border Color</label>
            <input
              type="color"
              value={form.border_color}
              onChange={(e) => handleChange("border_color", e.target.value)}
              className={styles.colorInput}
            />
          </div>
          <div className={styles.switchRow}>
            <input
              type="checkbox"
              checked={form.show_qr}
              onChange={(e) => handleChange("show_qr", e.target.checked)}
              className={styles.checkboxInput}
            />
            <span className={styles.label}>Include QR Code</span>
          </div>
        </div>
      </section>

      {/* Logo & Background Uploads */}
      <section className={styles.section}>
        <h2 className={styles.title}>🖼 Logo & Background</h2>
        <div className={styles.grid}>
          <div>
            <label className={styles.label}>Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "logo")}
              className={styles.fileInput}
            />
            <img
              src={logoPreview}
              alt="Logo Preview"
              className={styles.preview}
            />
          </div>
          <div>
            <label className={styles.label}>Background Texture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "background")}
              className={styles.fileInput}
            />
            <img
              src={bgPreview}
              alt="Background Preview"
              className={styles.preview}
            />
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className={styles.actions}>
        <Button
          variant="outline"
          onClick={() => setShowPreview(true)}
        >
          <FaEye /> Preview
        </Button>
        <Button
          variant="accent"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <FaSpinner className={styles.spinner} /> Saving...
            </>
          ) : (
            <>
              <FaSave /> {submitText}
            </>
          )}
        </Button>
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
