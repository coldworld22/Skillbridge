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
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../../next-i18next.config.js';
import AdminLayout from '@/components/layouts/AdminLayout';
import withAuthProtection from '@/hooks/withAuthProtection';
import { FaArrowLeft } from 'react-icons/fa';
import { fetchAdminClassById, updateAdminClass } from '@/services/admin/classService';
import { fetchAllInstructors } from '@/services/admin/instructorService';
import { fetchPlanIdentifiers } from '@/services/admin/planService';
import useNotificationStore from '@/store/notifications/notificationStore';
import useMessageStore from '@/store/messages/messageStore';
import { toDateInput } from '@/utils/date';

const normalizeIncludedPlans = (included = [], availablePlans = []) => {
  if (!Array.isArray(included) || included.length === 0) return [];

  const idToSlug = availablePlans.reduce((acc, plan) => {
    if (!plan) return acc;
    if (plan.slug) {
      acc[plan.slug] = plan.slug;
    }
    if (plan.id !== undefined && plan.slug) {
      acc[String(plan.id)] = plan.slug;
    }
    return acc;
  }, {});

  const normalized = included
    .map((value) => {
      if (value === undefined || value === null) return null;
      const key = typeof value === 'number' ? String(value) : String(value);
      return idToSlug[key] || idToSlug[value] || key;
    })
    .filter(Boolean);

  return Array.from(new Set(normalized));
};

const arraysEqual = (a = [], b = []) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const normalizeInstructor = (instructor) => {
  if (!instructor) return null;

  const rawId =
    instructor.id ?? instructor._id ?? instructor.user_id ?? instructor.userId;
  if (rawId === undefined || rawId === null) {
    return null;
  }

  const firstName =
    typeof instructor.first_name === 'string'
      ? instructor.first_name.trim()
      : '';
  const lastName =
    typeof instructor.last_name === 'string'
      ? instructor.last_name.trim()
      : '';
  const fullNameFromParts = [firstName, lastName].filter(Boolean).join(' ');
  const providedFullName =
    typeof instructor.full_name === 'string'
      ? instructor.full_name.trim()
      : '';
  const fallbackName =
    typeof instructor.name === 'string' ? instructor.name.trim() : '';
  const email =
    typeof instructor.email === 'string' ? instructor.email.trim() : '';

  const full_name = fullNameFromParts || providedFullName || fallbackName || email;

  return {
    id: String(rawId),
    full_name,
    email,
  };
};

export function EditClassPage() {
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
  const [instructors, setInstructors] = useState([]);
  const [instructorSearch, setInstructorSearch] = useState('');
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [instructorId, setInstructorId] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchAdminClassById(id);
        if (data) {
          setFormData({
            title: data.title || '',
            instructor: data.instructor || '',
            start_date:
              data.startDateInput ||
              (data.start_date ? toDateInput(data.start_date) : ''),
            end_date:
              data.endDateInput ||
              (data.end_date ? toDateInput(data.end_date) : ''),
            category: data.category_id || '',
            price: data.price || '',
            status: data.publishStatus || data.status || '',
            description: data.description || '',
            max_students: data.max_students || '',
            access_type: data.access_type || 'paid',
            included_plans: normalizeIncludedPlans(data.included_plans || [], plans),
          });
          setInstructorId(
            data.instructor_id !== undefined && data.instructor_id !== null
              ? String(data.instructor_id)
              : ''
          );
        }
      } catch (err) {
        console.error('Failed to load class', err);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    fetchPlanIdentifiers()
      .then((list) => setPlans(Array.isArray(list) ? list : []))
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadInstructors = async () => {
      try {
        setLoadingInstructors(true);
        const { instructors: data } = await fetchAllInstructors(1, 100);
        if (!isActive) return;

        const normalized = [];
        const seen = new Set();
        (Array.isArray(data) ? data : []).forEach((item) => {
          const normalizedInstructor = normalizeInstructor(item);
          if (!normalizedInstructor) return;
          if (seen.has(normalizedInstructor.id)) return;
          seen.add(normalizedInstructor.id);
          normalized.push(normalizedInstructor);
        });

        setInstructors(normalized);
      } catch (error) {
        console.error('Failed to load instructors', error);
        if (isActive) {
          setInstructors([]);
          toast.error(
            t('failed_to_load_instructors', {
              defaultValue: 'Failed to load instructors. Please try again.',
            })
          );
        }
      } finally {
        if (isActive) {
          setLoadingInstructors(false);
        }
      }
    };

    loadInstructors();

    return () => {
      isActive = false;
    };
  }, [t]);

  useEffect(() => {
    if (!plans.length) return;
    setFormData((prev) => {
      const normalized = normalizeIncludedPlans(prev.included_plans, plans);
      if (arraysEqual(prev.included_plans, normalized)) return prev;
      return { ...prev, included_plans: normalized };
    });
  }, [plans]);

  const filteredInstructors = useMemo(() => {
    const search = instructorSearch.trim().toLowerCase();
    if (!search) {
      return instructors;
    }

    return instructors.filter((inst) => {
      const name = typeof inst?.full_name === 'string' ? inst.full_name : '';
      const email = typeof inst?.email === 'string' ? inst.email : '';
      return (
        name.toLowerCase().includes(search) || email.toLowerCase().includes(search)
      );
    });
  }, [instructors, instructorSearch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const togglePlan = (slug) => {
    setFormData((prev) => ({
      ...prev,
      included_plans: prev.included_plans.includes(slug)
        ? prev.included_plans.filter((s) => s !== slug)
        : [...prev.included_plans, slug],
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
      payload.append('status', formData.status || '');
      payload.append('access_type', formData.access_type);
      if (instructorId) payload.append('instructor_id', instructorId);
      if (formData.access_type === 'free') {
        payload.append('price', '0');
        const uniquePlans = Array.from(new Set(formData.included_plans));
        payload.append('included_plans', JSON.stringify(uniquePlans));
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
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('instructor_select_label')}
          </label>
          <input
            type="text"
            value={instructorSearch}
            onChange={(event) => setInstructorSearch(event.target.value)}
            placeholder={t('instructor_search_placeholder')}
            className="w-full border rounded px-4 py-2"
          />
          <select
            value={instructorId}
            onChange={(event) => setInstructorId(event.target.value)}
            className="w-full border rounded px-4 py-2"
          >
            <option value="">{t('select_instructor_placeholder')}</option>
            {filteredInstructors.map((inst) => {
              const name = inst?.full_name || inst?.email || '';
              const email = inst?.email && inst?.full_name ? ` (${inst.email})` : '';
              return (
                <option key={inst.id} value={inst.id}>
                  {`${name}${email}`}
                </option>
              );
            })}
          </select>
          {loadingInstructors && (
            <p className="text-sm text-gray-500">{t('loading', { defaultValue: 'Loading...' })}</p>
          )}
          {!loadingInstructors && filteredInstructors.length === 0 && (
            <p className="text-sm text-gray-500">{t('no_instructors_found')}</p>
          )}
        </div>
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
          {formData.access_type === 'free' && (
            <div className="flex flex-wrap gap-4">
              {plans.map((p) => (
                <label key={p.id} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    value={p.slug}
                    checked={formData.included_plans.includes(p.slug)}
                    onChange={() => togglePlan(p.slug)}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{p.slug}</span>
                </label>
              ))}
            </div>
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
  roles: ['admin', 'superadmin'],
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