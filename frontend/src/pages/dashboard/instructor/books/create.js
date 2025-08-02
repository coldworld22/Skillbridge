import { useRouter } from "next/router";
import { toast } from "react-toastify";
import api from "@/services/api/api";
import BookForm from "@/components/books/BookForm";

export default function CreateBook() {
  const router = useRouter();

  const handleSubmit = async (values) => {
    try {
      await api.post("/books", values);
      toast.success("Book created");
      router.push("/dashboard/instructor/books");
    } catch (e) {
      console.error("Failed to create book", e);
      toast.error("Failed to create book");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Add New Book</h1>
      <BookForm onSubmit={handleSubmit} />
    </div>
  );
}
