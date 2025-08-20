import AdminLayout from "@/components/layouts/AdminLayout";
import { FaPlus, FaEdit, FaTrash, FaEye, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import {
  fetchPopupAnnouncements,
  updatePopupAnnouncement,
  deletePopupAnnouncement,
} from "@/services/admin/popupAnnouncementService";
import PopupPreviewModal from "@/components/admin/settings/PopupPreviewModal";

export default function PopupAnnouncementsIndex() {
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'popupAnnouncementsPage' });
  const [announcements, setAnnouncements] = useState([]);
  const [previewAnn, setPreviewAnn] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPopupAnnouncements();
        const formatted = (data || []).map((a) => ({
          ...a,
          status: a.active,
          audience: a.audience,
          pages: Array.isArray(a.pages) ? a.pages.join(', ') : a.pages,
          start: a.start_date,
          end: a.end_date,
        }));
        setAnnouncements(formatted);
      } catch (err) {
        console.error('Failed to load announcements', err);
        toast.error(t('loading_failed'));
      }
    };
    load();
  }, [t]);

  const toggleStatus = async (id) => {
    const ann = announcements.find((a) => a.id === id);
    if (!ann) return;
    try {
      const updated = await updatePopupAnnouncement(id, { active: !ann.status });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: updated.active } : a))
      );
      toast.success(t('status_updated'));
    } catch (err) {
      console.error('Failed to update', err);
      toast.error(t('update_failed'));
    }
  };

  const deleteAnnouncement = async (id) => {
    if (confirm(t('confirm_delete'))) {
      try {
        await deletePopupAnnouncement(id);
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        toast.success(t('announcement_deleted'));
      } catch (err) {
        console.error('Failed to delete', err);
        toast.error(t('delete_failed'));
      }
    }
  };

  return (
    <AdminLayout title={t('title')}>
      <div className="flex justify-between items-center mb-6" dir={i18n.dir()}>
        <h1 className="text-2xl font-bold text-gray-800">📢 {t('title')}</h1>
        <Link
          href="/dashboard/admin/settings/popup-announcement/create"
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded shadow flex items-center gap-2"
        >
          <FaPlus /> {t('add_new')}
        </Link>
      </div>

      <div className="overflow-x-auto" dir={i18n.dir()}>
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">{t('title_label')}</th>
              <th className="p-3 text-left">{t('audience')}</th>
              <th className="p-3 text-left">{t('pages')}</th>
              <th className="p-3 text-left">{t('schedule')}</th>
              <th className="p-3 text-center">{t('status')}</th>
              <th className="p-3 text-center">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.title}</td>
                <td className="p-3">{a.audience}</td>
                <td className="p-3">{a.pages}</td>
                <td className="p-3 text-sm text-gray-600">
                  {a.start} → {a.end}
                </td>
                <td className="p-3 text-center">
                  <button onClick={() => toggleStatus(a.id)}>
                    {a.status ? (
                      <FaToggleOn className="text-green-500 text-xl" />
                    ) : (
                      <FaToggleOff className="text-gray-400 text-xl" />
                    )}
                  </button>
                </td>
                <td className="p-3 text-center flex justify-center gap-3">
                  <button title={t('preview')} onClick={() => setPreviewAnn(a)}>
                    <FaEye className="text-blue-500" />
                  </button>
                  <a href={`/dashboard/admin/settings/popup-announcement/edit/${a.id}`}>
                    <FaEdit className="text-yellow-500" />
                  </a>
                  <button onClick={() => deleteAnnouncement(a.id)} title={t('delete')}>
                    <FaTrash className="text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {previewAnn && <PopupPreviewModal data={previewAnn} onClose={() => setPreviewAnn(null)} />}
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
