import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaVideo,
  FaHourglassHalf,
  FaCheckCircle,
  FaTags,
  FaCertificate,
  FaBell,
  FaEye,
  FaClipboardList,
  FaSearch,
  FaSortAmountDown,
} from 'react-icons/fa';
import StudentLayout from '@/components/layouts/StudentLayout';
import { fetchMyEnrolledClasses, subscribeToClassReminder } from '@/services/classService';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../next-i18next.config.js';

const FILTER_OPTIONS = [
  { value: 'all', labelKey: 'filter_all' },
  { value: 'ongoing', labelKey: 'filter_live' },
  { value: 'upcoming', labelKey: 'filter_upcoming' },
  { value: 'completed', labelKey: 'filter_completed' },
];

export default function MyEnrolledClassesPage() {
  const { t } = useTranslation('dashboard', { keyPrefix: 'studentOnlineClassesPage' });
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reminderStatus, setReminderStatus] = useState({});

  const router = useRouter();

  const parseDate = useCallback((value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }, []);

  const formatDateTime = useCallback((value) => {
    const date = parseDate(value);
    return date ? date.toLocaleString() : t('to_be_announced');
  }, [parseDate, t]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchMyEnrolledClasses();
        setClasses(list);
      } catch (err) {
        console.error('Failed to load classes', err);
        setError(t('error_generic'));
        toast.error(t('toast_load_error'));
      }
      setLoading(false);
    };
    load();
  }, []);

  const filteredClasses = useMemo(() => {
    return classes
      .filter((cls) => {
        if (filter === 'all') return true;
        const schedule = cls.scheduleStatus?.toLowerCase?.();
        return schedule === filter;
      })
      .filter((cls) => (cls.title || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const dateA = parseDate(a.startDate);
        const dateB = parseDate(b.startDate);

        if (!dateA && !dateB) return 0;
        if (!dateA) return sortOrder === 'asc' ? 1 : -1;
        if (!dateB) return sortOrder === 'asc' ? -1 : 1;

        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [classes, filter, parseDate, search, sortOrder]);

  const visibleClasses = filteredClasses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredClasses.length;

  const handleReminderSubscribe = async (classId) => {
    try {
      setReminderStatus((prev) => ({ ...prev, [classId]: 'loading' }));
      await subscribeToClassReminder(classId);
      setReminderStatus((prev) => ({ ...prev, [classId]: 'success' }));
      toast.success(t('reminder_success_message'));
    } catch (err) {
      console.error('Failed to subscribe to reminder', err);
      setReminderStatus((prev) => ({ ...prev, [classId]: 'idle' }));
      toast.error(t('reminder_failure_message'));
    }
  };

  const getReminderState = (classId) => reminderStatus[classId] || 'idle';

  const getFilterCount = useCallback((status) => {
    if (status === 'all') return classes.length;
    return classes.filter((cls) => cls.scheduleStatus?.toLowerCase?.() === status).length;
  }, [classes]);

  return (
    <StudentLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">{t('title')}</h1>

        {loading && (
          <p className="text-gray-600">{t('loading')}</p>
        )}

        {error && !loading && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 border rounded px-3 py-2 w-full sm:w-1/2">
            <FaSearch className="text-gray-500" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none"
            />
          </div>
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-full text-sm"
          >
            <FaSortAmountDown /> {t('sort_by_date')} ({sortOrder === 'asc' ? t('sort_order_asc') : t('sort_order_desc')})
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {FILTER_OPTIONS.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                filter === value
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t(labelKey)} ({getFilterCount(value)})
            </button>
          ))}
        </div>

        {/* Class Cards */}
        {visibleClasses.length === 0 ? (
          loading ? (
            <p className="text-gray-600 text-center">{t('empty_preparing')}</p>
          ) : (
            <div className="text-center text-gray-600">
              <p>{t('empty_no_results')}</p>
              <p className="text-sm mt-2">
                {t('empty_suggestion_prefix')} <Link href="/dashboard/student">{t('return_to_dashboard')}</Link> {t('empty_suggestion_suffix')}
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleClasses.map(cls => {
              const reminderState = getReminderState(cls.id);
              const isReminderLoading = reminderState === 'loading';
              const reminderSubscribed = reminderState === 'success';
              const scheduleStatusRaw = cls.scheduleStatus || 'Upcoming';
              const normalizedSchedule = scheduleStatusRaw.toLowerCase();
              const displaySchedule = normalizedSchedule === 'ongoing'
                ? t('status_live')
                : normalizedSchedule === 'upcoming'
                  ? t('status_upcoming')
                  : t('status_completed');

              return (
                <div key={cls.id} className="bg-gray-100 p-5 rounded-xl shadow-md">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800">
                    <FaChalkboardTeacher className="text-yellow-500" /> {cls.title}
                  </h2>
                  <FaEye
                    className="text-gray-500 hover:text-gray-800 cursor-pointer mt-1"
                    title={t('preview')}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/dashboard/student/online-classes/${cls.linkId || cls.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        router.push(`/dashboard/student/online-classes/${cls.linkId || cls.id}`);
                      }
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-1">{t('instructor_label')}: {cls.instructor}</p>
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                  <FaCalendarAlt /> {formatDateTime(cls.startDate)}
                </p>
                <p className="flex items-center text-xs text-gray-500 mb-2">
                  <FaTags className="mr-1 text-gray-400" /> {cls.tags?.join(', ') || t('tags_general')}
                </p>
                <div className="h-2 bg-gray-300 rounded-full mb-2">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${cls.progress || 0}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mb-2">{t('completed_percent', { percent: cls.progress || 0 })}</p>

                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-2 ${
                  normalizedSchedule === 'ongoing'
                    ? 'bg-green-100 text-green-800'
                    : normalizedSchedule === 'upcoming'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {displaySchedule}
                </span>

                {normalizedSchedule === 'upcoming' && (
                  <button
                    type="button"
                    disabled={isReminderLoading || reminderSubscribed}
                    onClick={() => handleReminderSubscribe(cls.id)}
                    className={`text-xs underline mb-2 flex items-center gap-1 ${
                      reminderSubscribed
                        ? 'text-green-600 cursor-default'
                        : 'text-blue-600 hover:text-blue-700'
                    } ${isReminderLoading ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    <FaBell />
                    {reminderSubscribed ? t('reminder_set') : isReminderLoading ? t('reminder_subscribing') : t('reminder_notify_me')}
                  </button>
                )}
                {cls.enrollmentStatus === 'completed' && (
                  <Link
                    href={`/dashboard/student/certificates/${cls.id}`}
                    className="text-xs text-green-600 underline mb-2 block text-center"
                  >
                    <FaCertificate className="inline mr-1" /> {t('certificate_view')}
                  </Link>
                )}
                <Link
                  href={`/dashboard/student/assignments/${cls.id}`}
                  className="text-xs text-blue-600 underline mb-3 block text-center"
                >
                  <FaClipboardList className="inline mr-1" /> {t('assignments_view')}
                </Link>
                {normalizedSchedule === 'ongoing' && cls.joined ? (
                  <Link
                    href={`/dashboard/student/assignments/${cls.id}`}
                    className="text-xs text-blue-600 underline mb-3 block text-center"
                  >
                    <FaClipboardList className="inline mr-1" /> {t('assignments_view')}
                  </Link>
                ) : normalizedSchedule === 'upcoming' ? (
                  <p className="text-center text-sm text-yellow-600">
                    <FaHourglassHalf className="inline mr-1" /> {t('starts_soon')}
                  </p>
                ) : cls.enrollmentStatus === 'completed' ? (
                  <p className="text-center text-sm text-gray-500">
                    <FaCheckCircle className="inline mr-1" /> {t('completed')}
                  </p>
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    <FaHourglassHalf className="inline mr-1" /> {t('class_ended')}
                  </p>
                )}
                </div>
              );
            })}
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="mt-10 block mx-auto bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-full"
          >
            {t('load_more')}
          </button>
        )}
      </div>
    </StudentLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
