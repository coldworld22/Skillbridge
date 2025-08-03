import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { fetchBookCategories } from "@/services/bookCategoryService";

export default function BookForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { status: "draft" } });
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

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("category_id", data.category_id);
    if (data.tags) {
      const tags = data.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tags.length) formData.append("tags", JSON.stringify(tags));
    }
    formData.append("short_description", data.short_description);
    formData.append("detailed_description", data.detailed_description);
    if (data.cover_image?.[0]) formData.append("cover_image", data.cover_image[0]);
    if (data.book_file?.[0]) formData.append("book_file", data.book_file[0]);
    if (data.preview_pages?.length) {
      Array.from(data.preview_pages).forEach((file) =>
        formData.append("preview_pages", file)
      );
    }
    formData.append("price", data.price);
    formData.append("language", data.language);
    formData.append("license_type", data.license_type);
    formData.append("status", data.status);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Book Title</label>
        <input
          type="text"
          {...register("title", { required: "Book title is required" })}
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

      <div>
        <label className="block text-sm font-medium mb-1">Tags (optional)</label>
        <input
          type="text"
          placeholder="JavaScript, Frontend, React, Web"
          {...register("tags")}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Short Description</label>
        <textarea
          {...register("short_description", {
            required: "Short description is required",
          })}
          className="w-full border rounded p-2"
        />
        {errors.short_description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.short_description.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Detailed Description
        </label>
        <textarea
          {...register("detailed_description", {
            required: "Detailed description is required",
          })}
          className="w-full border rounded p-2 h-32"
        />
        {errors.detailed_description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.detailed_description.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cover Image</label>
        <input
          type="file"
          accept=".png,.jpg,.jpeg"
          {...register("cover_image", {
            required: "Cover image is required",
            validate: {
              fileType: (files) =>
                !files[0] ||
                ["image/png", "image/jpeg"].includes(files[0].type) ||
                "Only PNG or JPG",
              fileSize: (files) =>
                !files[0] || files[0].size <= 2 * 1024 * 1024 || "Max 2MB",
            },
          })}
          className="w-full"
        />
        {errors.cover_image && (
          <p className="text-red-500 text-sm mt-1">
            {errors.cover_image.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Book File (PDF)</label>
        <input
          type="file"
          accept=".pdf"
          {...register("book_file", {
            required: "Book file is required",
            validate: {
              fileType: (files) =>
                !files[0] || files[0].type === "application/pdf" || "PDF only",
              fileSize: (files) =>
                !files[0] || files[0].size <= 50 * 1024 * 1024 || "Max 50MB",
            },
          })}
          className="w-full"
        />
        {errors.book_file && (
          <p className="text-red-500 text-sm mt-1">
            {errors.book_file.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Preview Pages (optional)
        </label>
        <input
          type="file"
          accept=".pdf,image/*"
          multiple
          {...register("preview_pages")}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Price</label>
        <input
          type="number"
          step="0.01"
          {...register("price", { required: "Price is required" })}
          className="w-full border rounded p-2"
        />
        {errors.price && (
          <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Language</label>
        <select
          {...register("language", { required: "Language is required" })}
          className="w-full border rounded p-2"
        >
          <option value="">Select language</option>
          <option value="english">English</option>
          <option value="arabic">Arabic</option>
          <option value="french">French</option>
        </select>
        {errors.language && (
          <p className="text-red-500 text-sm mt-1">
            {errors.language.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">License Type</label>
        <select
          {...register("license_type", {
            required: "License type is required",
          })}
          className="w-full border rounded p-2"
        >
          <option value="">Select license type</option>
          <option value="personal">Personal use</option>
          <option value="educational">Educational use</option>
          <option value="commercial">
            Commercial resale not allowed
          </option>
        </select>
        {errors.license_type && (
          <p className="text-red-500 text-sm mt-1">
            {errors.license_type.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Publish Status</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="draft"
              {...register("status", {
                required: "Publish status is required",
              })}
              defaultChecked
            />
            <span>Save as Draft</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="published"
              {...register("status", {
                required: "Publish status is required",
              })}
            />
            <span>Publish Now</span>
          </label>
        </div>
        {errors.status && (
          <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
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
