import AdminLayout from "@/components/layouts/AdminLayout";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { saveTemplate } from "@/services/admin/certificateTemplateService";
import CertificateTemplateForm from "@/components/admin/certificates/CertificateTemplateForm";
import withAdminGuard from "@/hooks/withAdminGuard";

function CreateCertificateTemplate() {
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  const initialValues = {
    name: "",
    type: "Completion",
    border_color: "#FACC15",
    font_family: "Georgia, serif",
    title_font: "'Great Vibes', cursive",
    show_qr: true,
    logo: null,
    background: null,
    sample_data: {
      id: "ABC123",
      student_name: "Student Name",
      course_name: "Course Title",
      issue_date: today,
      instructor: "Instructor Name",
      platform_name: "Platform Name",
      grade: "A+",
    },
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
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
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

export default withAdminGuard(CreateCertificateTemplate);
