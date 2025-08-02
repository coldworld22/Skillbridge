import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { fetchBookCategories } from "@/services/bookCategoryService";

export default function BookForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBookCategories();
        setCategories(data);
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    };
    load();
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          {...register("title", { required: "Title is required" })}
          className="w-full border rounded p-2"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          {...register("category_id", { required: "Category is required" })}
          className="w-full border rounded p-2"
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <p className="text-red-500 text-sm mt-1">
            {errors.category_id.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save
      </button>
    </form>
  );
}
