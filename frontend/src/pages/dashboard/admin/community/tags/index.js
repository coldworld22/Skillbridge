import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import {
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/services/admin/communityService";
import slugify from "@/utils/slugify";

export default function AdminTagsPage() {
  const { t } = useTranslation('dashboard', { keyPrefix: 'tagsPage' });
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTags();
        setTags(data || []);
      } catch (err) {
        const msg = err?.response?.data?.message || t('load_failed');
        toast.error(msg);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    const trimmed = newTag.trim();
    if (!trimmed) {
      alert("Tag name is required");
      return;
    }

    const slug = slugify(trimmed);
    const exists = tags.some(
      (t) =>
        t.id !== editing?.id &&
        (t.name.toLowerCase() === trimmed.toLowerCase() || t.slug === slug)
    );
    if (exists) {
      alert("Tag already exists");
      return;
    }

    try {
      const payload = { name: trimmed, slug };
      if (editing) {
        const updated = await updateTag(editing.id, payload);
        setTags((prev) =>
          prev.map((tag) => (tag.id === editing.id ? updated : tag))
        );
        toast.success(t('tag_updated'));
        setEditing(null);
      } else {
        const created = await createTag(payload);
        setTags((prev) => [...prev, created]);
        toast.success(t('tag_created'));
      }
      setNewTag("");
    } catch (err) {
      console.error("Failed to save tag", err);
      alert("Failed to save tag");
    }
  };

  const handleEdit = (tag) => {
    setEditing(tag);
    setNewTag(tag.name);
  };

  const handleDelete = async (id) => {
    const confirmDelete = confirm(t('delete_confirm'));
    if (!confirmDelete) return;
    try {
      await deleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
      toast.success(t('tag_deleted'));
    } catch (err) {
      const msg = err?.response?.data?.message || t('delete_failed');
      toast.error(msg);
    }
  };

  return (
    <AdminLayout title={t('manage')}>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

        {/* Create/Edit */}
        <div className="flex items-center gap-3 mb-8">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder={t('placeholder')}
            className="border border-gray-300 px-4 py-2 rounded w-full"
          />
          <button
            onClick={handleSave}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaPlus />
            {editing ? t('update') : t('add')}
          </button>
        </div>

        {/* Tag List */}
        {error && (
          <div className="text-red-500 mb-4 text-sm">{error}</div>
        )}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent"></div>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-gray-500 text-center">No tags found</div>
          ) : (
            tags.map((tag) => (
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
            ))
          )}
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
