import React, { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { ArrowLeftCircle, Upload } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function CreateCategory() {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [status, setStatus] = useState("active");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const rawCategories = [
    { id: "1", name: "Medical", parent_id: null },
    { id: "2", name: "Nursing", parent_id: "1" },
    { id: "3", name: "Pediatrics", parent_id: "2" },
    { id: "4", name: "Programming", parent_id: null },
    { id: "5", name: "Web Development", parent_id: "4" },
    { id: "6", name: "Frontend", parent_id: "5" }
  ];

  const formatCategories = (list, parent = null, prefix = "") => {
    return list
      .filter(cat => cat.parent_id === parent)
      .flatMap(cat => [
        { id: cat.id, name: `${prefix}${cat.name}` },
        ...formatCategories(list, cat.id, `${prefix}${cat.name} > `)
      ]);
  };
  const parentCategories = formatCategories(rawCategories);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/") && file.size <= 2 * 1024 * 1024) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setError("Please upload a valid image (max 2MB).");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    setError("");
    setLoading(true);

    setTimeout(() => {
      console.log({ name, parentId, status, image });
      toast.success("Category created!");
      setLoading(false);
      setName("");
      setParentId("");
      setStatus("active");
      setImage(null);
      setPreview(null);
    }, 500);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/admin/categories">
          <ArrowLeftCircle className="text-gray-600 hover:text-primary" size={28} />
        </Link>
        <h2 className="text-2xl font-semibold">Create New Category</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow-sm border">
        <div>
          <label htmlFor="name" className="block mb-1 font-medium">Category Name <span className="text-red-500">*</span></label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border px-4 py-2 rounded focus:ring focus:border-primary"
            placeholder="e.g. Pediatrics"
            aria-invalid={!!error}
          />
          {error && <p className="text-red-500 text-sm mt-1" aria-live="polite">{error}</p>}
        </div>

        <div>
          <label htmlFor="parentId" className="block mb-1 font-medium">Parent Category</label>
          <select
            id="parentId"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full border px-4 py-2 rounded focus:ring focus:border-primary"
          >
            <option value="">None (Top-Level)</option>
            {parentCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block mb-1 font-medium">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border px-4 py-2 rounded focus:ring focus:border-primary"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label htmlFor="image" className="block mb-1 font-medium">Category Image <span className="text-xs text-gray-500">(Max 2MB)</span></label>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm bg-gray-100 px-4 py-2 rounded hover:bg-gray-200">
              <Upload size={16} /> Upload Image
              <input id="image" type="file" accept="image/*" onChange={handleImageChange} hidden />
            </label>
            {preview && (
              <img src={preview} alt="Preview" className="w-16 h-16 rounded object-cover border" />
            )}
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2 rounded shadow text-white transition-all duration-150 font-medium text-sm
              ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Saving...
              </>
            ) : (
              <>Save Category</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

CreateCategory.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};