import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import {
  fetchPosts,
  createPost,
  updatePost,
  deletePost,
} from "@/services/admin/blogService";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function AdminBlogManager() {
  const [posts, setPosts] = useState([]);
  const { t } = useTranslation("dashboard", { keyPrefix: "blogManagerPage" });

  const [newPost, setNewPost] = useState({
    title: "",
    excerpt: "",
    content: "",
    date: new Date().toISOString().split("T")[0],
    imageFile: null,
    preview: null,
  });

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const list = await fetchPosts();
      setPosts(list);
    } catch (err) {
      console.error("Failed to load posts", err);
      toast.error(t("load_failed"));
    }
  };

  const handleAdd = async () => {
    if (!newPost.title || !newPost.excerpt || !newPost.content || !newPost.imageFile) return;
    try {
      const form = new FormData();
      form.append("title", newPost.title);
      form.append("excerpt", newPost.excerpt);
      form.append("content", newPost.content);
      form.append("published_at", newPost.date);
      form.append("image", newPost.imageFile);
      const saved = await createPost(form);
      setPosts((prev) => [...prev, saved]);
      resetForm();
      toast.success(t("create_success"));
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || t("create_failed"));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t("confirm_delete"))) return;
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((post) => post.id !== id));
      toast.success(t("delete_success"));
    } catch (err) {
      console.error(err);
      toast.error(t("delete_failed"));
    }
  };

  const handleEdit = (id) => {
    const post = posts.find((p) => p.id === id);
    setEditId(id);
    setNewPost({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content || "",
      date: post.published_at ? post.published_at.split("T")[0] : new Date().toISOString().split("T")[0],
      imageFile: null,
      preview: post.image_url ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${post.image_url}` : null,
    });
  };

  const handleSave = async () => {
    try {
      const form = new FormData();
      form.append("title", newPost.title);
      form.append("excerpt", newPost.excerpt);
      form.append("content", newPost.content);
      form.append("published_at", newPost.date);
      if (newPost.imageFile) form.append("image", newPost.imageFile);
      const updated = await updatePost(editId, form);
      setPosts((prev) => prev.map((p) => (p.id === editId ? updated : p)));
      resetForm();
      toast.success(t("update_success"));
    } catch (err) {
      console.error(err);
      toast.error(t("update_failed"));
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const resetForm = () => {
    setEditId(null);
    setNewPost({
      title: "",
      excerpt: "",
      content: "",
      date: new Date().toISOString().split("T")[0],
      imageFile: null,
      preview: null,
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

        <div className="bg-white shadow rounded p-4 mb-8 space-y-4">
          <input
            type="text"
            placeholder={t("post_title_placeholder")}
            className="w-full border p-2 rounded"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          />

          {/* Image upload with preview */}
          <div className="space-y-2">
            <label className="block font-medium">{t("upload_image")}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const imageUrl = URL.createObjectURL(file);
                  setNewPost((prev) => ({ ...prev, imageFile: file, preview: imageUrl }));
                }
              }}
              className="w-full border p-2 rounded"
            />
            {newPost.preview && (
              <div className="mt-2">
                <img src={newPost.preview} alt="Preview" className="rounded max-h-48 object-cover border" />
              </div>
            )}
          </div>

          <textarea
            placeholder={t("excerpt_placeholder")}
            className="w-full border p-2 rounded"
            value={newPost.excerpt}
            onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
          />
          <textarea
            placeholder={t("content_placeholder", "Enter content")}
            className="w-full border p-2 rounded"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
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
                  <FaSave /> {t("save")}
                </button>
                <button onClick={handleCancel} className="bg-gray-500 text-white px-4 py-2 rounded flex items-center gap-2">
                  <FaTimes /> {t("cancel")}
                </button>
              </>
            ) : (
              <button onClick={handleAdd} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2">
                <FaPlus /> {t("add_post")}
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-100 rounded shadow overflow-hidden">
              {post.image_url && (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${post.image_url}`}
                  alt={post.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg">{post.title}</h3>
                {post.published_at && (
                  <p className="text-sm text-gray-600 mb-2">{post.published_at.split('T')[0]}</p>
                )}
                <p className="text-gray-700 text-sm mb-4">{post.excerpt}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(post.id)} className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1">
                    <FaEdit /> {t("edit")}
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1">
                    <FaTrash /> {t("delete")}
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}