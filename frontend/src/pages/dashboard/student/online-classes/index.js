import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
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
  FaSortAmountDown
} from 'react-icons/fa';
import StudentLayout from '@/components/layouts/StudentLayout';
import withAuthProtection from '@/hooks/withAuthProtection';
import { fetchMyEnrolledClasses, subscribeToClassReminder } from '@/services/classService';
import { toast } from 'react-toastify';

function MyEnrolledClassesPage() {
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [error, setError] = useState(null);
  const { t } = useTranslation('dashboard');

  const statusLabels = {
    all: t('studentOnlineClassesPage.status_all'),
    ongoing: t('studentOnlineClassesPage.status_live'),
    upcoming: t('studentOnlineClassesPage.status_upcoming'),
    completed: t('studentOnlineClassesPage.status_completed')
  };
  const scheduleStatusLabels = {
    Ongoing: t('studentOnlineClassesPage.status_live'),
    Upcoming: t('studentOnlineClassesPage.status_upcoming'),
    Completed: t('studentOnlineClassesPage.status_completed')
  };

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchMyEnrolledClasses();
        setClasses(list);
        setError(null);
      } catch (err) {
        console.error('Failed to load classes', err);
        toast.error('Failed to load classes');
        setError('Failed to load classes');
      }
    };
    load();
  }, []);

  const handleNotify = async (classId) => {
    try {
      await subscribeToClassReminder(classId);
      toast.success(t('studentOnlineClassesPage.notify_success'));
    } catch (err) {
      console.error('Failed to subscribe to class reminder', err);
      toast.error(t('studentOnlineClassesPage.notify_error'));
    }
  };

  const getScheduleDate = (cls) => {
    const timestamp =
      cls.start_date || cls.startDate || cls.end_date || cls.endDate || null;

    if (!timestamp) {
      return null;
    }

    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const classesWithSchedule = classes.map((cls) => ({
    ...cls,
    scheduleDate: getScheduleDate(cls),
  }));

  const filteredClasses = classesWithSchedule
    .filter(
      (cls) => filter === 'all' || cls.scheduleStatus?.toLowerCase() === filter,
    )
    .filter((cls) => (cls.title || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dateA = a.scheduleDate;
      const dateB = b.scheduleDate;

      if (!dateA && !dateB) {
        return 0;
      }

      if (!dateA) {
        return 1;
      }

      if (!dateB) {
        return -1;
      }

      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const visibleClasses = filteredClasses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredClasses.length;

  if (error) {
    return (
      <StudentLayout>
        <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
          <p className="text-center text-red-500">{error}</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">{t('studentOnlineClassesPage.title')}</h1>

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 border rounded px-3 py-2 w-full sm:w-1/2">
            <FaSearch className="text-gray-500" />
            <input
              type="text"
              placeholder={t('studentOnlineClassesPage.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none"
            />
          </div>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-full text-sm"
          >
            <FaSortAmountDown /> {t('studentOnlineClassesPage.sort_by_date')} ({sortOrder.toUpperCase()})
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {['all', 'ongoing', 'upcoming', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                filter === status
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {statusLabels[status]} ({
                status === 'all'
                  ? classes.length
                  : classes.filter(
                      (c) => c.scheduleStatus?.toLowerCase() === status,
                    ).length
              })
            </button>
          ))}
        </div>

        {/* Class Cards */}
        {visibleClasses.length === 0 ? (
          <p className="text-gray-600 text-center">{t('studentOnlineClassesPage.no_classes')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleClasses.map(cls => (
              <div key={cls.id} className="bg-gray-100 p-5 rounded-xl shadow-md">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800">
                    <FaChalkboardTeacher className="text-yellow-500" /> {cls.title}
                  </h2>
                  <FaEye
                    className="text-gray-500 hover:text-gray-800 cursor-pointer mt-1"
                    title={t('studentOnlineClassesPage.preview')}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-1">{t('studentOnlineClassesPage.instructor')} {cls.instructor}</p>
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                  <FaCalendarAlt />
                  {cls.scheduleDate
                    ? cls.scheduleDate.toLocaleString()
                    : t('studentOnlineClassesPage.schedule_pending', {
                        defaultValue: t('studentOnlineClassesPage.class_ended'),
                      })}
                </p>
                <p className="flex items-center text-xs text-gray-500 mb-2">
                  <FaTags className="mr-1 text-gray-400" />
                  {cls.tags?.join(', ') || t('studentOnlineClassesPage.category_general')}
                </p>
                <div className="h-2 bg-gray-300 rounded-full mb-2">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${cls.progress || 0}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mb-2">{t('studentOnlineClassesPage.progress_completed', { progress: cls.progress || 0 })}</p>

                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-2 ${
                  cls.scheduleStatus === 'Ongoing'
                    ? 'bg-green-100 text-green-800'
                    : cls.scheduleStatus === 'Upcoming'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {scheduleStatusLabels[cls.scheduleStatus] || cls.scheduleStatus}
                </span>

                {cls.scheduleStatus === 'Upcoming' && (
                  <button
                    className="text-xs text-blue-600 underline mb-2 flex items-center gap-1"
                    onClick={() => handleNotify(cls.id)}
                  >
                    <FaBell /> {t('studentOnlineClassesPage.notify_me')}
                  </button>
                )}
                {cls.enrollmentStatus === 'completed' && (
                  <Link
                    href={`/dashboard/student/certificates/${cls.id}`}
                    className="text-xs text-green-600 underline mb-2 block text-center"
                  >
                    <FaCertificate className="inline mr-1" /> {t('studentOnlineClassesPage.view_certificate')}
                  </Link>
                )}
                <Link
                  href={`/dashboard/student/assignments/${cls.id}`}
                  className="text-xs text-blue-600 underline mb-3 block text-center"
                >
                  <FaClipboardList className="inline mr-1" /> {t('studentOnlineClassesPage.view_assignments')}
                </Link>
                {cls.scheduleStatus === 'Ongoing' &&
                  cls.enrollmentStatus?.toLowerCase() === 'enrolled' ? (
                  <Link
                    href={`/dashboard/student/online-classes/${cls.linkId || cls.id}`}
                    className="block bg-yellow-500 text-black text-center py-2 px-4 rounded hover:bg-yellow-600 font-semibold"
                  >
                    <FaVideo className="inline mr-2" /> {t('studentOnlineClassesPage.join_class')}
                  </Link>
                ) : cls.scheduleStatus === 'Upcoming' ? (
                  <p className="text-center text-sm text-yellow-600">
                    <FaHourglassHalf className="inline mr-1" /> {t('studentOnlineClassesPage.starts_soon')}
                  </p>
                ) : (
                  cls.enrollmentStatus === 'completed' ? (
                    <p className="text-center text-sm text-gray-500">
                      <FaCheckCircle className="inline mr-1" /> {t('studentOnlineClassesPage.completed')}
                    </p>
                  ) : (
                    <p className="text-center text-sm text-gray-500">
                      <FaHourglassHalf className="inline mr-1" /> {t('studentOnlineClassesPage.class_ended')}
                    </p>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <button
            onClick={() => setVisibleCount(prev => prev + 6)}
            className="mt-10 block mx-auto bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-full"
          >
            {t('studentOnlineClassesPage.load_more')}
          </button>
        )}
      </div>
    </StudentLayout>
  );
}

export default withAuthProtection(MyEnrolledClassesPage, ['student']);
