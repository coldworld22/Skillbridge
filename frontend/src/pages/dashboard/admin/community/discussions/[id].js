import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaLock, FaTrash, FaArrowLeft, FaCheck } from "react-icons/fa";
import { markAsResolved } from "@/utils/community/moderation";
import {
  fetchDiscussionById,
  lockDiscussionById,
  deleteDiscussionById,
} from "@/services/admin/communityService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { toast } from "react-toastify";

export default function AdminDiscussionDetailsPage() {
  const { t } = useTranslation("dashboard", {
    keyPrefix: "communityDiscussionDetailsPage",
  });
  const router = useRouter();
  const { id } = router.query;

  const [discussion, setDiscussion] = useState(null);
  const [locking, setLocking] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchDiscussionById(id);
        if (data) {
          setDiscussion({
            id: data.id,
            title: data.title,
            user: data.user_name || data.user_id || t("unknown_user", "Unknown user"),
            status: data.locked ? "locked" : data.resolved ? "resolved" : "open",
            replies: Array.isArray(data.replies) ? data.replies : [],
            content: data.content,
            createdAt: data.created_at || null,
          });
        }
      } catch (err) {
        console.error("Failed to load discussion", err);
        toast.error(t("load_failed", "Unable to load this discussion."));
      }
    };
    load();
  }, [id, t]);

  const handleLock = async () => {
    if (!discussion || discussion.status === "locked") return;
    try {
      setLocking(true);
      await lockDiscussionById(id);
      setDiscussion((prev) => (prev ? { ...prev, status: "locked" } : prev));
      toast.success(t("lock_success", "Discussion locked."));
    } catch (err) {
      console.error("Failed to lock discussion", err);
      toast.error(t("lock_failed", "Failed to lock discussion."));
    } finally {
      setLocking(false);
    }
  };

  const handleMarkResolved = () => {
    if (!discussion || discussion.status === "resolved") return;
    setResolving(true);
    setDiscussion((prev) => markAsResolved(prev));
    toast.success(t("resolve_success", "Discussion marked as resolved."));
    setResolving(false);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t("confirm_delete"));
    if (!confirmed) return;
    try {
      setDeleting(true);
      await deleteDiscussionById(id);
      toast.success(t("delete_success", "Discussion deleted."));
      router.push("/dashboard/admin/community/discussions");
    } catch (err) {
      console.error("Failed to delete discussion", err);
      toast.error(t("delete_failed", "Failed to delete discussion."));
    } finally {
      setDeleting(false);
    }
  };

  if (!discussion) return <div className="p-6">{t("loading")}</div>;

  return (
    <AdminLayout title={t("title")}>
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-black flex items-center mb-4">
          <FaArrowLeft className="mr-2" /> {t("back")}
        </button>

        <h1 className="text-2xl font-bold mb-1">{discussion.title}</h1>
        <p className="text-gray-600 mb-4">{t("posted_by", { user: discussion.user })}</p>

        {/* Status Indicator */}
        <span
          className={`inline-block px-3 py-1 text-sm rounded-full font-semibold mb-6 ${
            discussion.status === "locked"
              ? "bg-red-100 text-red-700"
              : discussion.status === "resolved"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {t(`status.${discussion.status}`)}
        </span>

        {/* Admin Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleLock}
            disabled={locking || discussion.status === "locked"}
            className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FaLock /> {t("lock_thread")}
          </button>
          <button
            onClick={handleMarkResolved}
            disabled={resolving || discussion.status === "resolved"}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FaCheck /> {t("mark_resolved")}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FaTrash /> {t("delete")}
          </button>
        </div>

        {discussion.content && (
          <div className="bg-white p-4 rounded shadow space-y-4 mb-6">
            <p className="text-gray-800 whitespace-pre-line">{discussion.content}</p>
          </div>
        )}

        {/* Replies Section */}
        <div className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-lg font-semibold mb-2">{t("replies")}</h2>
          {Array.isArray(discussion.replies) && discussion.replies.length > 0 ? (
            discussion.replies.map((reply) => (
              <div key={reply.id} className="border-b pb-3">
                <p className="text-gray-800">{reply.text}</p>
                <p className="text-sm text-gray-500 mt-1">— {reply.user} • {reply.timestamp}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">{t("no_replies")}</p>
          )}
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
