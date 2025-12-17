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
import styles from "../settings.module.scss";

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
      <div className={styles.header} dir={i18n.dir()}>
        <h1 className={styles.title}>📢 {t('title')}</h1>
        <Link
          href="/dashboard/admin/settings/popup-announcement/create"
          className={styles.buttonPrimary}
        >
          <FaPlus /> {t('add_new')}
        </Link>
      </div>

      <div className={styles.tableWrap} dir={i18n.dir()}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>{t('title_label')}</th>
              <th className={styles.th}>{t('audience')}</th>
              <th className={styles.th}>{t('pages')}</th>
              <th className={styles.th}>{t('schedule')}</th>
              <th className={styles.th} style={{ textAlign: "center" }}>{t('status')}</th>
              <th className={styles.th} style={{ textAlign: "center" }}>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((a) => (
              <tr key={a.id} className={styles.row}>
                <td className={styles.td}>{a.title}</td>
                <td className={styles.td}>{a.audience}</td>
                <td className={styles.td}>{a.pages}</td>
                <td className={styles.td}>
                  {a.start} → {a.end}
                </td>
                <td className={styles.td} style={{ textAlign: "center" }}>
                  <button onClick={() => toggleStatus(a.id)} className={styles.actionBtn}>
                    {a.status ? (
                      <FaToggleOn color="#16a34a" />
                    ) : (
                      <FaToggleOff color="#9ca3af" />
                    )}
                  </button>
                </td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    <button title={t('preview')} onClick={() => setPreviewAnn(a)} className={styles.actionBtn}>
                      <FaEye />
                    </button>
                    <Link href={`/dashboard/admin/settings/popup-announcement/edit/${a.id}`} className={styles.actionBtn}>
                      <FaEdit />
                    </Link>
                    <button onClick={() => deleteAnnouncement(a.id)} title={t('delete')} className={styles.actionBtn}>
                      <FaTrash color="#dc2626" />
                    </button>
                  </div>
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

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
