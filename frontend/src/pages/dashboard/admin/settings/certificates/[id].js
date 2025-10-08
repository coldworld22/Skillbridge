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
          setInitialValues(toSnakeCase(existing));
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
    return <div className="p-8 text-gray-600">Loading template...</div>;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
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
