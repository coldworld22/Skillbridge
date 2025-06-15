import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import {
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/services/admin/communityService";

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");

export default function AdminTagsPage() {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTags();
        setTags(data || []);
      } catch (err) {
        console.error("Failed to load tags", err);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!newTag.trim()) return;
    try {
      const payload = { name: newTag, slug: slugify(newTag) };
      if (editing) {
        const updated = await updateTag(editing.id, payload);
        setTags((prev) =>
          prev.map((tag) => (tag.id === editing.id ? updated : tag))
        );
        setEditing(null);
      } else {
        const created = await createTag(payload);
        setTags((prev) => [...prev, created]);
      }
      setNewTag("");
    } catch (err) {
      console.error("Failed to save tag", err);
    }
  };

  const handleEdit = (tag) => {
    setEditing(tag);
    setNewTag(tag.name);
  };

  const handleDelete = async (id) => {
    const confirmDelete = confirm("Delete this tag?");
    if (!confirmDelete) return;
    try {
      await deleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete tag", err);
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
