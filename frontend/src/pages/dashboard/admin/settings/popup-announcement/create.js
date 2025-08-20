import AdminLayout from "@/components/layouts/AdminLayout";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { FaSave, FaEye } from "react-icons/fa";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { createPopupAnnouncement } from "@/services/admin/popupAnnouncementService";
import { fetchPageList } from "@/services/admin/seoConfigService";
import PopupPreviewModal from "@/components/admin/settings/PopupPreviewModal";

const RichTextEditor = dynamic(() => import("react-quill"), { ssr: false });

const useAdminNotice = () => {
  const user = useAuthStore((s) => s.user);
  const refreshNotifications = useNotificationStore((s) => s.fetch);
  const refreshMessages = useMessageStore((s) => s.fetch);
  return async (type, message) => {
    try {
      await createNotification({ user_id: user.id, type, message });
      await sendChatMessage(user.id, { text: message });
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error(err);
    }
  };
};

export default function CreateAnnouncementForm() {
  const router = useRouter();
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'popupAnnouncementsPage' });
  const notify = useAdminNotice();
  const [form, setForm] = useState({
    title: "",
    message: "",
    audience: "all",
    pages: [],
    start: "",
    end: "",
    position: "center",
    theme: "yellow",
    oncePerSession: true,
    active: true,
  });

  const [allPages, setAllPages] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const loadPages = async () => {
      try {
        const pages = await fetchPageList();
        setAllPages(Array.isArray(pages) ? pages : []);
      } catch (err) {
        console.error('Failed to load pages', err);
        toast.error(t('loading_failed'));
      }
    };
    loadPages();
  }, [t]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (page) => {
    const updated = form.pages.includes(page)
      ? form.pages.filter((p) => p !== page)
      : [...form.pages, page];
    handleChange("pages", updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message || !form.start || !form.end) return;

    if (new Date(form.end) <= new Date(form.start)) {
      toast.error(i18n.t('dashboard:end_before_start'));
      return;
    }
    const payload = {
      title: form.title,
      message: form.message,
      audience: form.audience,
      pages: form.pages,
      start_date: form.start,
      end_date: form.end,
      position: form.position,
      theme: form.theme,
      once_per_session: form.oncePerSession,
      active: form.active,
    };
    try {
      await createPopupAnnouncement(payload);
      toast.success(t('announcement_saved'));
      notify("popup_created", `Popup announcement "${form.title}" created.`);
      router.push("/dashboard/admin/settings/popup-announcement");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t('save_failed'));
    }
  };

  return (
    <AdminLayout title={t('create_title')}>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto bg-white p-6 rounded shadow" dir={i18n.dir()}>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          📝 {t('create_title')}
        </h1>

        {/* TITLE */}
        <div>
          <label className="block font-semibold mb-1">{t('title_label')}</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Internal title for this popup"
            required
          />
        </div>

        {/* MESSAGE */}
        <div>
          <label className="block font-semibold mb-1">{t('message_label')}</label>
          <RichTextEditor
            value={form.message}
            onChange={(val) => handleChange("message", val)}
            theme="snow"
          />
        </div>

        {/* AUDIENCE */}
        <div>
          <label className="block font-semibold mb-1">{t('target_audience')}</label>
          <select
            value={form.audience}
            onChange={(e) => handleChange("audience", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="all">🌐 {t('all_visitors')}</option>
            <option value="logged-in">🔐 {t('logged_in')}</option>
            <option value="student">🎓 {t('students_only')}</option>
            <option value="instructor">🧑‍🏫 {t('instructors_only')}</option>
          </select>
        </div>

        {/* TARGET PAGES */}
        <div>
          <label className="block font-semibold mb-2">{t('target_pages')}</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allPages.map((page) => (
              <label key={page} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.pages.includes(page)}
                  onChange={() => handleCheckboxChange(page)}
                />
                <span className="text-gray-700">{page}</span>
              </label>
            ))}
          </div>
        </div>

        {/* TIMING */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">📆 {t('schedule')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-1">{t('start')}</label>
              <input
                type="datetime-local"
                className="w-full border rounded px-3 py-2"
                value={form.start}
                onChange={(e) => handleChange("start", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">{t('end')}</label>
              <input
                type="datetime-local"
                className="w-full border rounded px-3 py-2"
                value={form.end}
                onChange={(e) => handleChange("end", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* STYLE */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">🎨 {t('appearance')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-1">{t('popup_position')}</label>
              <select
                value={form.position}
                onChange={(e) => handleChange("position", e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                  <option value="center">🟨 {t('center')}</option>
                  <option value="top">⬆ {t('top')}</option>
                  <option value="bottom">⬇ {t('bottom')}</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">{t('theme_color')}</label>
              <select
                value={form.theme}
                onChange={(e) => handleChange("theme", e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                  <option value="yellow">🌕 {t('yellow')}</option>
                  <option value="blue">🔵 {t('blue')}</option>
                  <option value="green">🟢 {t('green')}</option>
                  <option value="red">🔴 {t('red')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* TOGGLES */}
        <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.oncePerSession}
                onChange={() => handleChange("oncePerSession", !form.oncePerSession)}
              />
            {t('show_once')}
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={() => handleChange("active", !form.active)}
            />
            {t('active')}
          </label>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={!form.title || !form.message || !form.start || !form.end}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded shadow disabled:opacity-50"
          >
            <FaSave className="inline mr-2" /> {t('save')}
          </button>
          <button
            type="button"
            className="border px-6 py-2 rounded shadow text-gray-800 hover:bg-gray-100"
            onClick={() => setShowPreview(true)}
          >
            <FaEye className="inline mr-2" /> {t('preview')}
          </button>
        </div>
      </form>
      {showPreview && <PopupPreviewModal data={form} onClose={() => setShowPreview(false)} />}
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
