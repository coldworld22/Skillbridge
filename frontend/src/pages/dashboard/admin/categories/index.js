import React, { useEffect, useState } from "react";
import { Plus, Search, FolderKanban, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import {
  fetchAllCategories,
  deleteCategory,
  updateCategoryStatus,
} from "@/services/admin/categoryService";
import { toast } from "react-toastify";

function AdminCategoryIndex() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, [search, statusFilter]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllCategories({ search, status: statusFilter });
      setCategories(result.data || []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
      setError("Failed to load categories.");
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus, name) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    if (!window.confirm(`Set ${name} to ${newStatus}?`)) return;

    try {
      await updateCategoryStatus(id, newStatus);
      const updated = categories.map((cat) =>
        cat.id === id ? { ...cat, status: newStatus } : cat
      );
      setCategories(updated);
      toast.success("Status updated");
    } catch (err) {
      console.error("Failed to update status", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update status";
      toast.error(msg);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteCategory(id);
      setCategories(categories.filter((cat) => cat.id !== id));
      toast.success("Category deleted!");
    } catch (err) {
      console.error("Failed to delete category", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to delete category";
      toast.error(msg);
    }
  };

  const getImage = (src) =>
    src ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/${src.replace(/^\/+/, "")}` :
    "https://via.placeholder.com/80x80?text=No+Image";

  const buildTree = (list, parentId = null) =>
    list
      .filter((item) => item.parent_id === parentId)
      .map((item) => ({
        ...item,
        children: buildTree(list, item.id),
      }));

  const categoryTree = buildTree(categories);

  const renderRows = (nodes, level = 0) =>
    nodes.flatMap((node) => [
      (
        <tr key={node.id} className={`border-t ${level === 0 ? "bg-gray-50 font-medium" : ""}`}> 
          <td className="px-4 py-3" style={{ paddingLeft: `${16 + level * 20}px` }}>
            {level > 0 && "↳ "}
            {node.name}
            {level > 0 && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                Subcategory
              </span>
            )}
          </td>
          <td className="px-4 py-3">
            <img
              src={getImage(node.image_url)}
              alt={node.name}
              onError={(e) => {
                e.target.src = getImage();
              }}
              className="h-10 w-10 rounded object-cover"
            />
          </td>
          <td className="px-4 py-3">{node.classes_count ?? "—"}</td>
          <td className="px-4 py-3">
            <button
              className={`px-2 py-1 text-sm rounded ${node.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
              onClick={() => toggleStatus(node.id, node.status, node.name)}
            >
              {node.status}
            </button>
          </td>
          <td className="px-4 py-3 text-right space-x-2">
            <Link href={`/dashboard/admin/categories/edit/${node.id}`}>
              <button className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-3 py-1 rounded-full text-sm transition" title="Edit Category">
                <Pencil size={14} /> Edit
              </button>
            </Link>
            <button
              onClick={() => handleDelete(node.id, node.name)}
              className="inline-flex items-center gap-2 bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 rounded-full text-sm transition"
              title="Delete Category"
            >
              <Trash2 size={14} /> Delete
            </button>
          </td>
        </tr>
      ),
      ...(node.children && node.children.length > 0 ? renderRows(node.children, level + 1) : []),
    ]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FolderKanban className="text-primary" />
          <h2 className="text-2xl font-semibold">Categories</h2>
        </div>
        <Link href="/dashboard/admin/categories/create">
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
            <Plus size={16} /> New Category
          </button>
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative w-1/3">
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border px-3 py-2 rounded pl-9"
          />
          <Search className="absolute left-2 top-2.5 text-gray-400" size={18} />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <Link href="/dashboard/admin/categories/create">
          <button className="ml-auto border px-4 py-2 rounded text-sm bg-yellow-400 text-white hover:bg-yellow-500">
            + Create Category
          </button>
        </Link>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Classes</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">Loading categories...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-red-500">{error}</td>
              </tr>
            ) : categoryTree.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No categories found. <Link href="/dashboard/admin/categories/create" className="text-blue-600 underline">Create one now</Link>
                </td>
              </tr>
            ) : (
              renderRows(categoryTree)
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-4 text-sm text-gray-500">
        <span>Showing 1–{categories.length} of {categories.length} categories</span>
        <div className="space-x-2">
          <button className="px-3 py-1 border rounded">Prev</button>
          <button className="px-3 py-1 border rounded">Next</button>
        </div>
      </div>
    </div>
  );
}

AdminCategoryIndex.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedAdminCategoryIndex = withAuthProtection(AdminCategoryIndex, [
  "admin",
  "superadmin",
]);

ProtectedAdminCategoryIndex.getLayout = AdminCategoryIndex.getLayout;

export default ProtectedAdminCategoryIndex;
