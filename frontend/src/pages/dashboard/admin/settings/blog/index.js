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
import styles from "../settings.module.scss";

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
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t("title")}</h1>
        </div>

        <div className={`${styles.card} ${styles.stack}`}>
          <input
            type="text"
            placeholder={t("post_title_placeholder")}
            className={styles.input}
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          />

          {/* Image upload with preview */}
          <div className={styles.stack}>
            <label className={styles.label}>{t("upload_image")}</label>
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
              className={styles.input}
            />
            {newPost.preview && (
              <div className={styles.previewWrapper}>
                <img src={newPost.preview} alt="Preview" className={styles.previewImage} />
              </div>
            )}
          </div>

          <textarea
            placeholder={t("excerpt_placeholder")}
            className={styles.textarea}
            value={newPost.excerpt}
            onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
          />
          <textarea
            placeholder={t("content_placeholder", "Enter content")}
            className={styles.textarea}
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          />
          <input
            type="date"
            className={styles.input}
            value={newPost.date}
            onChange={(e) => setNewPost({ ...newPost, date: e.target.value })}
          />

          <div className={styles.actions} style={{ justifyContent: "flex-start" }}>
            {editId ? (
              <>
                <button onClick={handleSave} className={styles.buttonPrimary}>
                  <FaSave /> {t("save")}
                </button>
                <button onClick={handleCancel} className={styles.buttonSecondary}>
                  <FaTimes /> {t("cancel")}
                </button>
              </>
            ) : (
              <button onClick={handleAdd} className={styles.buttonPrimary}>
                <FaPlus /> {t("add_post")}
              </button>
            )}
          </div>
        </div>

        <div className={styles.integrationGrid}>
          {posts.map((post) => (
            <div key={post.id} className={styles.card}>
              {post.image_url && (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${post.image_url}`}
                  alt={post.title}
                  className={styles.previewImage}
                />
              )}
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{post.title}</h3>
                {post.published_at && (
                  <p className={styles.mutedText}>{post.published_at.split('T')[0]}</p>
                )}
                <p className={styles.mutedText}>{post.excerpt}</p>
                <div className={styles.actions}>
                  <button onClick={() => handleEdit(post.id)} className={styles.buttonPrimary}>
                    <FaEdit /> {t("edit")}
                  </button>
                  <button onClick={() => handleDelete(post.id)} className={`${styles.buttonSecondary} ${styles.textDanger}`}>
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

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
