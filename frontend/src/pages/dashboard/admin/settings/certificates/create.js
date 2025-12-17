import AdminLayout from "@/components/layouts/AdminLayout";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { saveTemplate } from "@/services/admin/certificateTemplateService";
import CertificateTemplateForm from "@/components/admin/certificates/CertificateTemplateForm";
import styles from "../settings.module.scss";

export default function CreateCertificateTemplate() {
  const router = useRouter();

  const initialValues = {
    name: "",
    type: "Completion",
    border_color: "#FACC15",
    font_family: "Georgia, serif",
    title_font: "'Great Vibes', cursive",
    show_qr: true,
    logo: null,
    background: null,
    for_tutorials: true,
    for_online_classes: true,
  };

  const handleSubmit = async (data) => {
    try {
      await saveTemplate(data);
      toast.success("Template saved");
      router.push("/dashboard/admin/settings/certificates");
    } catch (err) {
      console.error("Failed to save template", err);
      toast.error("Failed to save template");
    }
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>
          🎓 Create Certificate Template
        </h1>
        <CertificateTemplateForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitText="Save Template"
        />
      </div>
    </AdminLayout>
  );
}
