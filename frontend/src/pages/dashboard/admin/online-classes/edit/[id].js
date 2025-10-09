// pages/dashboard/admin/online-classes/edit/[id].js
// pages/dashboard/admin/online-classes/edit/[id].js
// -------------------------------------------------
// This page allows admins to edit an existing class.
// Class details are fetched on mount and populated in
// the form. On submit the updated data is sent to the
// backend service. Success and error states are shown
// via toast notifications and the global notification
// and message stores are refreshed so the instructor
// is alerted about the update.
// -------------------------------------------------
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../../next-i18next.config.js';
import AdminLayout from '@/components/layouts/AdminLayout';
import withAuthProtection from '@/hooks/withAuthProtection';
import { FaArrowLeft } from 'react-icons/fa';
import { fetchAdminClassById, updateAdminClass } from '@/services/admin/classService';
import { fetchPlanIdentifiers } from '@/services/admin/planService';
import useNotificationStore from '@/store/notifications/notificationStore';
import useMessageStore from '@/store/messages/messageStore';

function EditClassPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t, i18n } = useTranslation('dashboard');
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const fetchMessages = useMessageStore((state) => state.fetch);

  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    start_date: '',
    end_date: '',
    category: '',
    price: '',
    status: '',
    description: '',
    max_students: '',
    access_type: 'paid',
    included_plans: [],
  });
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchAdminClassById(id);
        if (data) {
          setFormData({
            title: data.title || '',
            instructor: data.instructor || '',
            start_date: data.start_date || '',
            end_date: data.end_date || '',
            category: data.category_id || '',
            price: data.price || '',
            status: data.status || '',
            description: data.description || '',
            max_students: data.max_students || '',
            access_type: data.access_type || 'paid',
            included_plans: Array.isArray(data.included_plans) ? data.included_plans : [],
          });
        }
      } catch (err) {
        console.error('Failed to load class', err);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    fetchPlanIdentifiers({ includeInactive: true })
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const togglePlan = (planId) => {
    setFormData((prev) => ({
      ...prev,
      included_plans: prev.included_plans.includes(planId)
        ? prev.included_plans.filter((id) => id !== planId)
        : [...prev.included_plans, planId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      if (formData.title) payload.append('title', formData.title);
      if (formData.description) payload.append('description', formData.description);
      if (formData.start_date) payload.append('start_date', formData.start_date);
      if (formData.end_date) payload.append('end_date', formData.end_date);
      if (formData.category) payload.append('category_id', formData.category);
      if (formData.max_students) payload.append('max_students', formData.max_students);
      payload.append('status', formData.status);
      payload.append('access_type', formData.access_type);
      if (formData.access_type === 'free') {
        payload.append('price', '0');
        if (formData.included_plans.length)
          payload.append('included_plans', JSON.stringify(formData.included_plans));
      } else if (formData.price || formData.price === 0) {
        payload.append('price', formData.price);
      }
      await updateAdminClass(id, payload);
      toast.success(t('class_updated'));
      fetchNotifications();
      fetchMessages();
      router.push('/dashboard/admin/online-classes');
    } catch (err) {
      console.error('Failed to update class', err);
      toast.error(err.response?.data?.message || t('class_update_failed'));
    }
  };

  return (
    <div dir={i18n.dir()} className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-xl mt-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-600 hover:text-black flex items-center mb-4"
      >
        <FaArrowLeft className="mr-2" /> {t('back')}
      </button>
      <h1 className="text-2xl font-bold mb-4 text-gray-800">✏️ {t('edit_class')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder={t('class_title_label')}
          className="w-full border rounded px-4 py-2"
        />
        <input
          name="instructor"
          value={formData.instructor}
          onChange={handleChange}
          placeholder={t('instructor_name_label')}
          className="w-full border rounded px-4 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
          disabled
        />
        <div className="flex gap-4">
          <input
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
          <input
            name="end_date"
            type="date"
            value={formData.end_date}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
        </div>
        <input
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder={t('category_label')}
          className="w-full border rounded px-4 py-2"
        />
        <input
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          placeholder={t('price_label')}
          className="w-full border rounded px-4 py-2"
          disabled={formData.access_type === 'free'}
        />
        <div className="space-y-2">
          <div className="flex items-center gap-4 mt-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="access_type"
                value="paid"
                checked={formData.access_type === 'paid'}
                onChange={handleChange}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">{t('paid')}</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="access_type"
                value="free"
                checked={formData.access_type === 'free'}
                onChange={handleChange}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">{t('free_class')}</span>
            </label>
          </div>
          {formData.access_type === 'free' && plans.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {plans.map((p) => (
                <label key={p.id} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    value={p.id}
                    checked={formData.included_plans.includes(p.id)}
                    onChange={() => togglePlan(p.id)}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {p.name || p.slug}
                    {p.name && p.slug ? (
                      <span className="ml-1 text-xs text-gray-500">({p.slug})</span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          )}
          {formData.access_type === 'free' && plans.length === 0 && (
            <p className="text-sm text-gray-500">
              {t('no_student_plans_hint', {
                defaultValue: 'No student plans available yet. Create one to attach access.',
              })}
            </p>
          )}
        </div>
        <input
          name="max_students"
          type="number"
          value={formData.max_students}
          onChange={handleChange}
          placeholder={t('max_students_label')}
          className="w-full border rounded px-4 py-2"
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t('description_label')}
          className="w-full border rounded px-4 py-2 h-24"
        />
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full border rounded px-4 py-2"
        >
          <option value="">{t('select_status')}</option>
          <option value="draft">{t('pending')}</option>
          <option value="published">{t('approved')}</option>
          <option value="archived">{t('rejected')}</option>
        </select>

        <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded shadow">
          {t('save_changes')}
        </button>
      </form>
    </div>
  );
}

EditClassPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedEditClassPage = withAuthProtection(EditClassPage, {
  permissions: ['manage_online_classes'],
});
ProtectedEditClassPage.getLayout = EditClassPage.getLayout;

export default ProtectedEditClassPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
