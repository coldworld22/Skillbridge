import React from "react";
import { useEffect, useState } from "react";
import { Plus, Search, FolderKanban, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";

export default function AdminCategoryIndex() {
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
      await new Promise((res) => setTimeout(res, 300));

      const mock = [
        { id: 1, name: "Medical", image: "https://i.pinimg.com/736x/5e/6b/1c/5e6b1c6a633aeeaa013312b69c89ab11.jpg", status: "active", parent_id: null },
        { id: 2, name: "Nursing", image: "https://cdn.prod.website-files.com/63a1cbc81b0e903002cf9cec/642604b850060e114dc20476_I%27m%20Tired%20of%20Working%20with%20Patients-%20Now%20What%3F%208%20Non-Bedside%20Nursing%20Jobs%20to%20Consider%20.webp", status: "active", parent_id: 1, classes_count: 7 },
        { id: 3, name: "Dentistry", image: "https://static.vecteezy.com/system/resources/previews/036/594/504/non_2x/ai-generated-dental-clinic-advertisment-background-with-copy-space-free-photo.jpg", status: "inactive", parent_id: 1, classes_count: 3 },
        { id: 4, name: "Programming", image: "https://static.vecteezy.com/system/resources/previews/002/949/141/non_2x/programming-code-coding-or-hacker-background-vector.jpg", status: "active", parent_id: null },
        { id: 5, name: "Python", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcee1d7BKUYRz9G1VSsNuBO7D-6PWc73VSXw&s", status: "active", parent_id: 4, classes_count: 5 },
        { id: 6, name: "Web Development", image: "https://img.freepik.com/free-vector/laptop-with-program-code-isometric-icon-software-development-programming-applications-dark-neon_39422-971.jpg?semt=ais_hybrid&w=740", status: "active", parent_id: 4, classes_count: 4 }
      ];

      const filtered = mock.filter((cat) => {
        const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || cat.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      setCategories(filtered);
    } catch (err) {
      console.error("Failed to fetch categories", err);
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (id, currentStatus) => {
    const updated = categories.map((cat) =>
      cat.id === id ? { ...cat, status: currentStatus === "active" ? "inactive" : "active" } : cat
    );
    setCategories(updated);
  };

  const handleDelete = (id, name) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmDelete) return;
    const updated = categories.filter((cat) => cat.id !== id);
    setCategories(updated);
  };

  const groupedCategories = categories
    .filter((c) => c.parent_id === null)
    .map((parent) => ({
      ...parent,
      children: categories.filter((child) => child.parent_id === parent.id),
    }));

  const getImage = (src) => src || "https://via.placeholder.com/80x80?text=No+Image";

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
            ) : groupedCategories.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No categories found. <Link href="/dashboard/admin/categories/create" className="text-blue-600 underline">Create one now</Link>
                </td>
              </tr>
            ) : (
              groupedCategories.map((parent) => (
                <React.Fragment key={parent.id}>
                  <tr className="border-t bg-gray-50 font-medium">
                    <td className="px-4 py-3">{parent.name}</td>
                    <td className="px-4 py-3">
                      <img
                        src={getImage(parent.image)}
                        alt={parent.name}
                        onError={(e) => { e.target.src = getImage(); }}
                        className="h-10 w-10 rounded object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">
                      <button
                        className={`px-2 py-1 text-sm rounded ${parent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                        onClick={() => toggleStatus(parent.id, parent.status)}
                      >
                        {parent.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link href={`/dashboard/admin/categories/edit/${parent.id}`}>
                        <button className="text-blue-500 hover:text-blue-700"><Pencil size={16} /></button>
                      </Link>
                      <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(parent.id, parent.name)}><Trash2 size={16} /></button>
                    </td>
                  </tr>

                  {parent.children.map((child) => (
                    <tr key={child.id} className="border-t">
                      <td className="px-4 py-3 pl-8">
                        ↳ {child.name}
                        <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Subcategory</span>
                      </td>
                      <td className="px-4 py-3">
                        <img
                          src={getImage(child.image)}
                          alt={child.name}
                          onError={(e) => { e.target.src = getImage(); }}
                          className="h-10 w-10 rounded object-cover"
                        />
                      </td>
                      <td className="px-4 py-3">{child.classes_count ?? "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          className={`px-2 py-1 text-sm rounded ${child.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}
                          onClick={() => toggleStatus(child.id, child.status)}
                        >
                          {child.status}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Link href={`/dashboard/admin/categories/edit/${parent.id}`}>
                          <button
                            className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-3 py-1 rounded-full text-sm transition"
                            title="Edit Category"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(parent.id, parent.name)}
                          className="inline-flex items-center gap-2 bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 rounded-full text-sm transition"
                          title="Delete Category"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>

                    </tr>
                  ))}
                </React.Fragment>
              ))
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