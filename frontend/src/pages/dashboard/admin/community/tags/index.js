import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaEdit, FaTrash, FaPlus, FaTimes } from "react-icons/fa";
import {
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/services/admin/communityService";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { toast } from "react-toastify";

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");

export default function AdminTagsPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "communityTagsPage" });
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [editing, setEditing] = useState(null);
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    cancelText: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTags();
        setTags(data || []);
      } catch (err) {
        const msg = err?.response?.data?.message || t("load_failed");
        toast.error(msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const handleSave = async () => {
    const trimmed = newTag.trim();
    if (!trimmed) {
      alert(t("tag_required"));
      return;
    }

    const slug = slugify(trimmed);
    const exists = tags.some(
      (t) =>
        t.id !== editing?.id &&
        (t.name.toLowerCase() === trimmed.toLowerCase() || t.slug === slug)
    );
    if (exists) {
      alert(t("tag_exists"));
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
      alert(t("save_failed"));
    }
  };

  const handleEdit = (tag) => {
    setEditing(tag);
    setNewTag(tag.name);
    inputRef.current?.focus();
  };

  const handleCancel = () => {
    setEditing(null);
    setNewTag("");
    inputRef.current?.focus();
  };

  const openConfirmModal = ({ title, message, confirmText, cancelText, onConfirm }) => {
    setConfirmModal({ isOpen: true, title, message, confirmText, cancelText, onConfirm });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDelete = (tag) => {
    openConfirmModal({
      title: t("confirm_delete_title"),
      message: t("confirm_delete", { name: tag.name }),
      confirmText: t("delete"),
      cancelText: t("cancel"),
      onConfirm: async () => {
        try {
          await deleteTag(tag.id);
          setTags((prev) => prev.filter((t) => t.id !== tag.id));
        } catch (err) {
          console.error("Failed to delete tag", err);
        }
      },
    });

  };

  return (
    <AdminLayout title={t('manage')}>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

        {/* Create/Edit */}
        <div className="flex items-center gap-3 mb-8">
          <input
            ref={inputRef}
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
          {editing && (
            <button
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded flex items-center gap-2"
            >
              <FaTimes /> {t("cancel")}
            </button>
          )}
        </div>

        {/* Tag List */}
        {error && (
          <div className="text-red-500 mb-4 text-sm">{error}</div>
        )}
        <div className="space-y-3">
          {loading ? (
            <div className="text-gray-500 text-center">{t("loading")}</div>
          ) : tags.length === 0 ? (
            <div className="text-gray-500 text-center">{t("no_tags")}</div>
          ) : (
            tags.map((tag) => (
              <div
                key={tag.id}
                className="flex justify-between items-center bg-white px-4 py-2 rounded border border-gray-200 shadow-sm hover:shadow-md"
              >
                <span className="text-sm font-medium text-gray-700">#{tag.name}</span>
                <div className="flex gap-3 text-gray-600">
                  <button onClick={() => handleEdit(tag)} title={t("edit")}>
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(tag)} title={t("delete")}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          onClose={closeConfirmModal}
          onConfirm={confirmModal.onConfirm}
        />
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
