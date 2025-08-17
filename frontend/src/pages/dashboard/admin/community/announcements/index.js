import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaTrash } from "react-icons/fa";
import ConfirmModal from "@/components/common/ConfirmModal";
import {
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "@/services/admin/communityService";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function AdminAnnouncementsPage() {
  const { t } = useTranslation("dashboard", {
    keyPrefix: "communityAnnouncementsPage",
  });
  const [announcements, setAnnouncements] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [audience, setAudience] = useState("all");
  const [pinned, setPinned] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAnnouncements();
        const formatted = (data || []).map((a) => ({
          id: a.id,
          title: a.title,
          message: a.message,
          timestamp: new Date(a.created_at).toLocaleString(),
          startDate: a.start_date ? new Date(a.start_date).toLocaleString() : null,
          endDate: a.end_date ? new Date(a.end_date).toLocaleString() : null,
          audience: a.audience,
          pinned: a.pinned,
        }));
        setAnnouncements(formatted);
        toast.success(t("announcements_loaded"));
      } catch (err) {
        console.error("Failed to load announcements", err);
        toast.error(t("loading_failed"));
      }
    };
    load();
  }, [t]);

  const handlePost = async () => {
    if (!newTitle.trim() || !newMessage.trim()) return;
    try {
      const payload = {
        title: newTitle.trim(),
        message: newMessage.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
        audience,
        pinned,
      };
      const created = await createAnnouncement(payload);
      const newEntry = {
        id: created.id,
        title: created.title,
        message: created.message,
        timestamp: new Date(created.created_at).toLocaleString(),
        startDate: created.start_date ? new Date(created.start_date).toLocaleString() : null,
        endDate: created.end_date ? new Date(created.end_date).toLocaleString() : null,
        audience: created.audience,
        pinned: created.pinned,
      };
      setAnnouncements((prev) => [newEntry, ...prev]);
      setNewTitle("");
      setNewMessage("");
      setStartDate("");
      setEndDate("");
      setAudience("all");
      setPinned(false);
      toast.success(t("announcement_saved"));
    } catch (err) {
      console.error("Failed to post announcement", err);
      toast.error(t("save_failed"));
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const id = selectedId;
    if (!id) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success(t("announcement_deleted"));
    } catch (err) {
      console.error("Failed to delete announcement", err);
      toast.error(t("delete_failed"));
    }
  };

  return (
    <AdminLayout title={t("title")}>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t("heading")}</h1>

        {/* New Announcement Form */}
        <div className="mb-8">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t("announcement_title")}
            className="w-full border border-gray-300 rounded px-4 py-2 mb-2"
          />
          <textarea
            rows={3}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t("announcement_message")}
            className="w-full border border-gray-300 rounded px-4 py-2 resize-none"
          />
          <div className="flex flex-wrap gap-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
              placeholder={t("start_date")}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
              placeholder={t("end_date")}
            />
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">{t("audience_all")}</option>
              <option value="student">{t("audience_student")}</option>
              <option value="instructor">{t("audience_instructor")}</option>
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              <span>{t("pinned")}</span>
            </label>
          </div>
          <button
            onClick={handlePost}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded font-semibold"
          >
            {t("post")}
          </button>
        </div>

        {/* Existing Announcements */}
        <div className="space-y-4">
          {announcements.length > 0 ? (
            announcements.map((a) => (
              <div
                key={a.id}
                className="bg-white border-l-4 border-yellow-500 p-4 rounded shadow-sm relative"
              >
                <h3 className="text-lg font-semibold text-gray-900">{a.title}</h3>
                <p className="text-gray-800">{a.message}</p>
                <div className="text-sm text-gray-400 mt-1 space-y-1">
                  <p>{a.timestamp}</p>
                  {(a.startDate || a.endDate) && (
                    <p>
                      {t("schedule", { start: a.startDate || "—", end: a.endDate || "—" })}
                    </p>
                  )}
                  {a.audience && <p>{t("audience", { audience: a.audience })}</p>}
                  {a.pinned && (
                    <p className="text-yellow-600 font-semibold">{t("pinned")}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteClick(a.id)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">{t("no_announcements")}</p>
          )}
        </div>
        <ConfirmModal
          isOpen={isConfirmOpen}
          message={t("confirm_delete")}
          onClose={() => {
            setIsConfirmOpen(false);
            setSelectedId(null);
          }}
          onConfirm={confirmDelete}
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
