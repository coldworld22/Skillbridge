import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { fetchBookCategories } from "@/services/bookCategoryService";
import { fetchBookTags, createBookTag } from "@/services/bookTagService";
import { getLanguages } from "@/services/languageService";

export default function BookForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({ defaultValues: { tags: [], status: "pending" } });
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [coverPreview, setCoverPreview] = useState(null);
  const [bookFileName, setBookFileName] = useState("");
  const [previewFiles, setPreviewFiles] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBookCategories();
        setCategories(data);
      } catch (e) {
        console.error("Failed to load categories", e);
      }
      try {
        const langs = await getLanguages();
        setLanguages(langs);
      } catch (e) {
        console.error("Failed to load languages", e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    register("tags", {
      validate: (value) =>
        value && value.length > 0 ? true : "At least one tag is required",
    });
  }, [register]);

  useEffect(() => {
    setValue("tags", tags);
  }, [tags, setValue]);

  useEffect(() => {
    let ignore = false;
    if (tagInput) {
      fetchBookTags(tagInput).then((data) => {
        if (!ignore) setTagSuggestions(data);
      });
    } else {
      setTagSuggestions([]);
    }
    return () => {
      ignore = true;
    };
  }, [tagInput]);

  const addTag = (name) => {
    const value = name.trim();
    if (!value) return;
    if (!tags.includes(value)) {
      setTags([...tags, value]);
      if (!tagSuggestions.find((t) => t.name === value)) {
        createBookTag({ name: value }).then((newTag) =>
          setTagSuggestions((prev) => [...prev, newTag])
        );
      }
    }
    setTagInput("");
  };

  const removeTag = (name) => {
    setTags(tags.filter((t) => t !== name));
  };

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("category_id", data.category_id);
    formData.append("tags", JSON.stringify(tags));
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
    formData.append("status", "pending");
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Book Title</label>
        <input
          type="text"
          {...register("title", { required: "Book title is required" })}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          {...register("category_id", { required: "Category is required" })}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
        <label className="block text-sm font-medium mb-1">Tags</label>
        <div className="relative">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1.5 inline-flex text-yellow-500 hover:text-yellow-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Add tags..."
              className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="button"
              onClick={() => addTag(tagInput)}
              className="px-3 py-2 bg-yellow-500 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              Add
            </button>
          </div>
          {tagSuggestions.length > 0 && tagInput && (
            <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
              {tagSuggestions.map((t) => (
                <div
                  key={t.id}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 cursor-pointer"
                  onClick={() => addTag(t.name)}
                >
                  {t.name}
                </div>
              ))}
            </div>
          )}
        </div>
        {errors.tags && (
          <p className="text-red-500 text-sm mt-1">{errors.tags.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Short Description</label>
        <textarea
          {...register("short_description", {
            required: "Short description is required",
          })}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
          className="w-full border rounded p-2 h-32 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        {errors.detailed_description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.detailed_description.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cover Image</label>
        {(() => {
          const reg = register("cover_image", {
            required: "Cover image is required",
            validate: {
              fileType: (files) =>
                !files[0] ||
                ["image/png", "image/jpeg"].includes(files[0].type) ||
                "Only PNG or JPG",
              fileSize: (files) =>
                !files[0] || files[0].size <= 2 * 1024 * 1024 || "Max 2MB",
            },
          });
          return (
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              {...reg}
              onChange={(e) => {
                reg.onChange(e);
                const file = e.target.files?.[0];
                setCoverPreview(file ? URL.createObjectURL(file) : null);
              }}
              className="w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          );
        })()}
        {coverPreview && (
          <img
            src={coverPreview}
            alt="Cover preview"
            className="mt-2 h-32 object-cover"
          />
        )}
        {errors.cover_image && (
          <p className="text-red-500 text-sm mt-1">
            {errors.cover_image.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Book File (PDF)</label>
        {(() => {
          const reg = register("book_file", {
            required: "Book file is required",
            validate: {
              fileType: (files) =>
                !files[0] || files[0].type === "application/pdf" || "PDF only",
              fileSize: (files) =>
                !files[0] || files[0].size <= 50 * 1024 * 1024 || "Max 50MB",
            },
          });
          return (
            <input
              type="file"
              accept=".pdf"
              {...reg}
              onChange={(e) => {
                reg.onChange(e);
                const file = e.target.files?.[0];
                setBookFileName(file ? file.name : "");
              }}
              className="w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          );
        })()}
        {bookFileName && (
          <p className="text-sm mt-1">{bookFileName}</p>
        )}
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
        {(() => {
          const reg = register("preview_pages");
          return (
            <input
              type="file"
              accept=".pdf,image/*"
              multiple
              {...reg}
              onChange={(e) => {
                reg.onChange(e);
                const files = Array.from(e.target.files || []);
                setPreviewFiles(files);
              }}
              className="w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          );
        })()}
        {previewFiles.length > 0 && (
          <ul className="mt-2 list-disc pl-5">
            {previewFiles.map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Price</label>
        <input
          type="number"
          step="0.01"
          {...register("price", { required: "Price is required" })}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        {errors.price && (
          <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Language</label>
        <select
          {...register("language", { required: "Language is required" })}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="">Select language</option>
          {languages.map((l) => (
            <option key={l.code || l.id} value={l.code || l.id}>
              {l.name}
            </option>
          ))}
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
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        Save
      </button>
    </form>
  );
}
