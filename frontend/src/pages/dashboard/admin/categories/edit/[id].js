import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { ArrowLeftCircle, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  fetchCategoryTree,
  fetchCategoryById,
  updateCategory,
} from "@/services/admin/categoryService";

function EditCategory() {
  const router = useRouter();
  const { id } = router.query;

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [status, setStatus] = useState("active");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [parentCategories, setParentCategories] = useState([]);

  const formatCategories = (nodes, prefix = "") =>
    nodes.flatMap((n) => [
      { id: n.id, name: `${prefix}${n.name}` },
      ...(n.children ? formatCategories(n.children, `${prefix}${n.name} > `) : []),
    ]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const [tree, category] = await Promise.all([
          fetchCategoryTree(),
          fetchCategoryById(id),
        ]);
        setParentCategories(formatCategories(tree));
        if (category) {
          setName(category.name);
          setParentId(category.parent_id || "");
          setStatus(category.status);
          if (category.image_url) setPreview(category.image_url);
        }
      } catch (err) {
        console.error("Failed to load category", err);
        toast.error(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load category"
        );
      }
    };
    loadData();
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/") && file.size <= 2 * 1024 * 1024) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setError("Please upload a valid image (max 2MB). ");
      toast.error("Please upload a valid image (max 2MB).");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      toast.error("Category name is required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      if (parentId) formData.append("parent_id", parentId);
      formData.append("status", status);
      if (image) formData.append("image", image);

      await updateCategory(id, formData);
      toast.success("Category updated!");
      router.push("/dashboard/admin/categories");
    } catch (err) {
      console.error("Failed to update category", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update category";
      toast.error(msg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/admin/categories">
          <ArrowLeftCircle className="text-gray-600 hover:text-primary" size={28} />
        </Link>
        <h2 className="text-2xl font-semibold">Edit Category</h2>
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
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div>
          <label htmlFor="parent" className="block mb-1 font-medium">Parent Category</label>
          <select
            id="parent"
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
          <label htmlFor="image-upload" className="block mb-1 font-medium">Category Image <span className="text-xs text-gray-500">(Max 2MB)</span></label>
          <div className="flex items-center gap-4">
            <label htmlFor="image-upload" className="inline-flex items-center gap-2 cursor-pointer text-sm bg-gray-100 px-4 py-2 rounded hover:bg-gray-200">
              <Upload size={16} /> Upload Image
              <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} hidden />
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
              <>Update Category</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

EditCategory.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default withAuthProtection(EditCategory, ["admin", "superadmin"]);
