import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';
import { toast } from 'react-toastify';
import { updateInstructor } from '@/services/admin/instructorService';
import modalStyles from '@/components/common/Modal.module.scss';
import { Button } from '@/components/ui/button';

export default function InstructorDetailsModal({ instructor, onClose, onSave, useTabs }) {
  const { t } = useTranslation('dashboard', { keyPrefix: 'instructorsPage' });
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({ ...instructor });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateInstructor(form.id, form);
      onSave(updated);
      toast.success(t('details_updated'));
    } catch (err) {
      toast.error(t('details_update_failed'));
      console.error('Instructor update error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={modalStyles.simpleOverlay}>
      <div className={modalStyles.panel} style={{ maxWidth: "34rem", position: "relative" }}>
        <button
          onClick={onClose}
          className={modalStyles.closeButton}
          aria-label="Close"
        >
          <FaTimes size={18} />
        </button>

        <h2 className={modalStyles.title}>{t('details_title')}</h2>

        {useTabs && (
          <div className={modalStyles.optionButtons} style={{ marginBottom: "1rem" }}>
            {['profile', 'classes', 'edit'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${modalStyles.optionButton} ${
                  activeTab === tab ? modalStyles.optionButtonActive : ''
                }`}
              >
                {t(`tab_${tab}`)}
              </button>
            ))}
          </div>
        )}

        <div className={modalStyles.section}>
          {activeTab === 'profile' && (
            <div style={{ textAlign: 'center' }}>
              <img
                src={form.avatar}
                alt={form.name}
                style={{ width: '6rem', height: '6rem', borderRadius: '9999px', objectFit: 'cover', margin: '0 auto 0.5rem' }}
              />
              <p className={modalStyles.name}>{form.name}</p>
              <p className={modalStyles.mutedSmall}>{form.email}</p>
              <p className={modalStyles.muted} style={{ marginTop: '0.5rem' }}>{form.bio}</p>
              <p className={modalStyles.mutedSmall}>{t('joined', { date: form.joinDate })}</p>
              <p className={modalStyles.mutedSmall}>
                {t('status_label')}: {form.status ? t('active') : t('inactive')}
              </p>
            </div>
          )}

          {activeTab === 'classes' && (
            <div>
              <h3 className={modalStyles.subtitle}>{t('classes')}</h3>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }} className={modalStyles.muted}>
                {form.classes?.map((cls, idx) => (
                  <li key={idx}>{cls}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className={modalStyles.field} style={{ gap: '0.75rem' }}>
              <label className={modalStyles.label}>
                {t('name_label')}
                <input
                  type="text"
                  className={modalStyles.input}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className={modalStyles.label}>
                {t('email_label')}
                <input
                  type="email"
                  className={modalStyles.input}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className={modalStyles.label}>
                {t('bio_label')}
                <textarea
                  className={modalStyles.textarea}
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </label>
              <label className={modalStyles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.checked })}
                />
                {t('active')}
              </label>
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="accent"
              >
                {saving ? t('processing') : t('save_changes')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
