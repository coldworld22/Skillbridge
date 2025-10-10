import { useCallback, useEffect, useMemo, useState } from 'react';
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
  FaSortAmountDown,
} from 'react-icons/fa';
import StudentLayout from '@/components/layouts/StudentLayout';
import { fetchMyEnrolledClasses, subscribeToClassReminder } from '@/services/classService';
import { toast } from 'react-toastify';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_STYLES = {
  Upcoming: 'bg-yellow-100 text-yellow-800',
  Ongoing: 'bg-green-100 text-green-800',
  Completed: 'bg-gray-200 text-gray-600',
};

const formatDate = (value) => {
  if (!value) return 'Schedule TBA';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (err) {
    return value;
  }
};

export default function MyEnrolledClassesPage() {
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscribingId, setSubscribingId] = useState(null);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchMyEnrolledClasses();
      setClasses(list);
    } catch (err) {
      console.error('Failed to load classes', err);
      setError('We could not load your classes. Please try again.');
      toast.error('Failed to load enrolled classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const filteredClasses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return classes
      .filter((cls) =>
        filter === 'all' ? true : cls.scheduleStatus?.toLowerCase() === filter,
      )
      .filter((cls) =>
        normalizedSearch
          ? cls.title?.toLowerCase().includes(normalizedSearch)
          : true,
      )
      .slice()
      .sort((a, b) => {
        const timeA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
        const timeB = b.startDate ? new Date(b.startDate).getTime() : Infinity;

        const safeTimeA = Number.isFinite(timeA) ? timeA : Infinity;
        const safeTimeB = Number.isFinite(timeB) ? timeB : Infinity;

        return sortOrder === 'asc' ? safeTimeA - safeTimeB : safeTimeB - safeTimeA;
      });
  }, [classes, filter, search, sortOrder]);

  const visibleClasses = filteredClasses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredClasses.length;

  const handleSubscribe = async (classId) => {
    try {
      setSubscribingId(classId);
      await subscribeToClassReminder(classId);
      toast.success('You will be reminded before the class starts.');
    } catch (err) {
      console.error('Failed to subscribe to reminder', err);
      toast.error('Could not set a reminder right now.');
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <StudentLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">🎓 My Enrolled Classes</h1>

        {loading && (
          <div className="text-center text-gray-600 py-10">Loading your classes...</div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p className="mb-3">{error}</p>
            <button
              type="button"
              onClick={loadClasses}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 border rounded px-3 py-2 w-full sm:w-1/2">
            <FaSearch className="text-gray-500" />
            <input
              type="text"
              placeholder="Search classes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none"
            />
          </div>
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-full text-sm"
          >
            <FaSortAmountDown /> Sort by Date ({sortOrder.toUpperCase()})
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                filter === value
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {label} ({
                value === 'all'
                  ? classes.length
                  : classes.filter((c) => c.scheduleStatus?.toLowerCase() === value).length
              })
            </button>
          ))}
        </div>

        {/* Class Cards */}
        {!loading && visibleClasses.length === 0 ? (
          <p className="text-gray-600 text-center">No classes found under this filter.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleClasses.map((cls) => (
              <div key={cls.id} className="bg-gray-100 p-5 rounded-xl shadow-md">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800">
                    <FaChalkboardTeacher className="text-yellow-500" /> {cls.title}
                  </h2>
                  <FaEye className="text-gray-500 hover:text-gray-800 cursor-pointer mt-1" title="Preview" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Instructor: {cls.instructor}</p>
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                  <FaCalendarAlt /> {formatDate(cls.startDate)}
                </p>
                <p className="flex items-center text-xs text-gray-500 mb-2">
                  <FaTags className="mr-1 text-gray-400" /> {cls.tags?.join(', ') || 'General'}
                </p>
                <div className="h-2 bg-gray-300 rounded-full mb-2">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${cls.progress || 0}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mb-2">{cls.progress || 0}% completed</p>

                <span
                  className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-2 ${
                    STATUS_STYLES[cls.scheduleStatus] || 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {cls.scheduleStatus || 'Upcoming'}
                </span>

                {cls.scheduleStatus === 'Upcoming' && (
                  <button
                    type="button"
                    onClick={() => handleSubscribe(cls.id)}
                    disabled={subscribingId === cls.id}
                    className="text-xs text-blue-600 underline mb-2 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaBell />
                    {subscribingId === cls.id ? 'Subscribing...' : 'Notify Me'}
                  </button>
                )}
                {cls.enrollmentStatus === 'completed' && (
                  <Link
                    href={`/dashboard/student/certificates/${cls.id}`}
                    className="text-xs text-green-600 underline mb-2 block text-center"
                  >
                    <FaCertificate className="inline mr-1" /> View Certificate
                  </Link>
                )}
                <Link
                  href={`/dashboard/student/assignments/${cls.id}`}
                  className="text-xs text-blue-600 underline mb-3 block text-center"
                >
                  <FaClipboardList className="inline mr-1" /> View Assignments
                </Link>
                {cls.scheduleStatus === 'Ongoing' && cls.joined ? (
                  <Link
                    href={`/dashboard/student/online-classes/${cls.linkId || cls.id}`}
                    className="block bg-yellow-500 text-black text-center py-2 px-4 rounded hover:bg-yellow-600 font-semibold"
                  >
                    <FaVideo className="inline mr-2" /> Join Class
                  </Link>
                ) : cls.scheduleStatus === 'Upcoming' ? (
                  <p className="text-center text-sm text-yellow-600">
                    <FaHourglassHalf className="inline mr-1" /> Starts Soon
                  </p>
                ) : cls.enrollmentStatus === 'completed' ? (
                  <p className="text-center text-sm text-gray-500">
                    <FaCheckCircle className="inline mr-1" /> Completed
                  </p>
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    <FaHourglassHalf className="inline mr-1" /> Class Ended
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="mt-10 block mx-auto bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-full"
          >
            Load More
          </button>
        )}
      </div>
    </StudentLayout>
  );
}
