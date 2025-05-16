import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

const initialTags = [
  { id: 1, name: "React" },
  { id: 2, name: "Next.js" },
  { id: 3, name: "Odoo" },
];

export default function AdminTagsPage() {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    setTags(initialTags);
  }, []);

  const handleSave = () => {
    if (!newTag.trim()) return;
    if (editing) {
      setTags((prev) =>
        prev.map((tag) => (tag.id === editing.id ? { ...tag, name: newTag } : tag))
      );
      setEditing(null);
    } else {
      setTags((prev) => [...prev, { id: Date.now(), name: newTag.trim() }]);
    }
    setNewTag("");
  };

  const handleEdit = (tag) => {
    setEditing(tag);
    setNewTag(tag.name);
  };

  const handleDelete = (id) => {
    const confirmDelete = confirm("Delete this tag?");
    if (confirmDelete) {
      setTags((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <AdminLayout title="Manage Tags">
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Tags</h1>

        {/* Create/Edit */}
        <div className="flex items-center gap-3 mb-8">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Tag name"
            className="border border-gray-300 px-4 py-2 rounded w-full"
          />
          <button
            onClick={handleSave}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaPlus />
            {editing ? "Update" : "Add"}
          </button>
        </div>

        {/* Tag List */}
        <div className="space-y-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex justify-between items-center bg-white px-4 py-2 rounded border border-gray-200 shadow-sm hover:shadow-md"
            >
              <span className="text-sm font-medium text-gray-700">#{tag.name}</span>
              <div className="flex gap-3 text-gray-600">
                <button onClick={() => handleEdit(tag)} title="Edit">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete(tag.id)} title="Delete">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
