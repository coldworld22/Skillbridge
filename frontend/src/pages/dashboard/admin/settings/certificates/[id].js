import AdminLayout from "@/components/layouts/AdminLayout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getTemplate,
  updateTemplate,
} from "@/services/admin/certificateTemplateService";
import { toSnakeCase } from "@/utils/case";
import CertificateTemplateForm from "@/components/admin/certificates/CertificateTemplateForm";
import styles from "../settings.module.scss";

export default function EditCertificateTemplate() {
  const router = useRouter();
  const { id } = router.query;

  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const existing = await getTemplate(id);
        if (existing) {
          const normalized = toSnakeCase(existing);
          if (normalized.for_tutorials === undefined || normalized.for_tutorials === null) {
            normalized.for_tutorials = true;
          }
          if (normalized.for_online_classes === undefined || normalized.for_online_classes === null) {
            normalized.for_online_classes = true;
          }
          setInitialValues(normalized);
        }
      } catch (err) {
        console.error("Failed to load template", err);
        toast.error("Failed to load template");
      }
    };
    load();
  }, [id]);

  const handleUpdate = async (data) => {
    try {
      await updateTemplate(id, data);
      toast.success("Template updated");
      router.push("/dashboard/admin/settings/certificates");
    } catch (err) {
      console.error("Failed to update template", err);
      toast.error("Failed to update template");
    }
  };

  if (!initialValues)
    return <div className={styles.page}>Loading template...</div>;

  return (
    <AdminLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>
          ✏️ Edit Certificate Template
        </h1>
        <CertificateTemplateForm
          initialValues={initialValues}
          onSubmit={handleUpdate}
          submitText="Update Template"
        />
      </div>
    </AdminLayout>
  );
}
