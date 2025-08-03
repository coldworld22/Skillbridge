import { useRouter } from "next/router";
import { toast } from "react-toastify";
import api from "@/services/api/api";
import BookForm from "@/components/books/BookForm";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import withAuthProtection from "@/hooks/withAuthProtection";

function CreateBookPage() {
  const router = useRouter();

  const handleSubmit = async (formData) => {
    try {
      await api.post("/books", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Book submitted for review");
      router.push("/dashboard/instructor/books");
    } catch (e) {
      console.error("Failed to create book", e);
      toast.error("Failed to create book");
    }
  };

  return (
    <InstructorLayout>
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4">Add New Book</h1>
        <BookForm onSubmit={handleSubmit} />
      </div>
    </InstructorLayout>
  );
}

export default withAuthProtection(CreateBookPage, ["instructor"]);
