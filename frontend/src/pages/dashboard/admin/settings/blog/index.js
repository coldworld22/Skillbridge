import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";

export default function AdminBlogManager() {
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "10 Tips to Improve Online Learning",
      image: "https://source.unsplash.com/random/400x200?education",
      excerpt: "Discover how to stay motivated and succeed in online education.",
      date: "2025-05-14",
    },
  ]);

  const [newPost, setNewPost] = useState({
    title: "",
    excerpt: "",
    image: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [editId, setEditId] = useState(null);

  const handleAdd = () => {
    if (!newPost.title || !newPost.excerpt || !newPost.image) return;
    setPosts((prev) => [...prev, { ...newPost, id: Date.now() }]);
    resetForm();
  };

  const handleDelete = (id) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
  };

  const handleEdit = (id) => {
    const post = posts.find((p) => p.id === id);
    setEditId(id);
    setNewPost({ ...post });
  };

  const handleSave = () => {
    setPosts((prev) =>
      prev.map((p) => (p.id === editId ? { ...newPost, id: editId } : p))
    );
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
  };

  const resetForm = () => {
    setEditId(null);
    setNewPost({ title: "", excerpt: "", image: "", date: new Date().toISOString().split("T")[0] });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Manage Blog Posts</h1>

        <div className="bg-white shadow rounded p-4 mb-8 space-y-4">
          <input
            type="text"
            placeholder="Post Title"
            className="w-full border p-2 rounded"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          />

          {/* Image upload with preview */}
          <div className="space-y-2">
            <label className="block font-medium">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const imageUrl = URL.createObjectURL(file);
                  setNewPost((prev) => ({ ...prev, image: imageUrl }));
                }
              }}
              className="w-full border p-2 rounded"
            />
            {newPost.image && (
              <div className="mt-2">
                <img src={newPost.image} alt="Preview" className="rounded max-h-48 object-cover border" />
              </div>
            )}
          </div>

          <textarea
            placeholder="Excerpt"
            className="w-full border p-2 rounded"
            value={newPost.excerpt}
            onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
          />
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={newPost.date}
            onChange={(e) => setNewPost({ ...newPost, date: e.target.value })}
          />

          <div className="flex gap-4">
            {editId ? (
              <>
                <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
                  <FaSave /> Save
                </button>
                <button onClick={handleCancel} className="bg-gray-500 text-white px-4 py-2 rounded flex items-center gap-2">
                  <FaTimes /> Cancel
                </button>
              </>
            ) : (
              <button onClick={handleAdd} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2">
                <FaPlus /> Add Post
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-100 rounded shadow overflow-hidden">
              <img src={post.image} alt={post.title} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-lg">{post.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{post.date}</p>
                <p className="text-gray-700 text-sm mb-4">{post.excerpt}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(post.id)} className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1">
                    <FaEdit /> Edit
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1">
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}