import { useEffect, useState } from 'react';
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
  FaCheck
} from 'react-icons/fa';
import StudentLayout from '@/components/layouts/StudentLayout';
import { fetchMyEnrolledClasses, subscribeToClassReminder } from '@/services/classService';
import { toast } from 'react-toastify';

export default function MyEnrolledClassesPage() {
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [subscribingId, setSubscribingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchMyEnrolledClasses();
        setClasses(list);
      } catch (err) {
        console.error('Failed to load classes', err);
        toast.error('Unable to load your classes right now.');
      }
    };
    load();
  }, []);

  const handleSubscribe = async (classId) => {
    setSubscribingId(classId);
    try {
      await subscribeToClassReminder(classId);
      setClasses((prev) =>
        prev.map((item) =>
          item.id === classId
            ? { ...item, reminderSubscribed: true }
            : item
        )
      );
      toast.success('You will be notified when this class goes live.');
    } catch (err) {
      console.error('Failed to subscribe to reminder', err);
      const message = err?.response?.data?.message || 'Could not set the reminder. Please try again.';
      toast.error(message);
    } finally {
      setSubscribingId(null);
    }
  };

  const statusFilters = [
    { value: 'all', label: 'All' },
    { value: 'ongoing', label: 'Live Now' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' }
  ];

  const scheduleBadgeClasses = {
    Ongoing: 'bg-green-100 text-green-800',
    Upcoming: 'bg-yellow-100 text-yellow-800',
    Completed: 'bg-gray-200 text-gray-600'
  };

  const scheduleLabel = (status) => {
    if (!status) return 'Upcoming';
    if (status === 'Ongoing') return 'Live Now';
    return status;
  };

  const filteredClasses = classes
    .filter(cls => filter === 'all' || cls.scheduleStatus?.toLowerCase() === filter)
    .filter(cls => cls.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const visibleClasses = filteredClasses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredClasses.length;

  return (
    <StudentLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">🎓 My Enrolled Classes</h1>

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
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-full text-sm"
          >
            <FaSortAmountDown /> Sort by Date ({sortOrder.toUpperCase()})
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {statusFilters.map(({ value, label }) => (
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
                  : classes.filter(c => c.scheduleStatus?.toLowerCase() === value).length
              })
            </button>
          ))}
        </div>

        {/* Class Cards */}
        {visibleClasses.length === 0 ? (
          <p className="text-gray-600 text-center">No classes found under this filter.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleClasses.map(cls => (
              <div key={cls.id} className="bg-gray-100 p-5 rounded-xl shadow-md">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800">
                    <FaChalkboardTeacher className="text-yellow-500" /> {cls.title}
                  </h2>
                  <FaEye className="text-gray-500 hover:text-gray-800 cursor-pointer mt-1" title="Preview" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Instructor: {cls.instructor}</p>
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                  <FaCalendarAlt /> {new Date(cls.startDate).toLocaleString()}
                </p>
                <p className="flex items-center text-xs text-gray-500 mb-2">
                  <FaTags className="mr-1 text-gray-400" /> {cls.tags?.join(', ') || 'General'}
                </p>
                <div className="h-2 bg-gray-300 rounded-full mb-2">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${cls.progress || 0}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mb-2">{cls.progress || 0}% completed</p>

                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-2 ${
                  scheduleBadgeClasses[cls.scheduleStatus] || 'bg-gray-200 text-gray-600'
                }`}>
                  {scheduleLabel(cls.scheduleStatus)}
                </span>

                {cls.scheduleStatus === 'Upcoming' && (
                  <div className="text-center mb-2">
                    {cls.reminderSubscribed ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold">
                        <FaCheck /> Reminder set
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(cls.id)}
                        disabled={subscribingId === cls.id}
                        className="text-xs text-blue-600 underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaBell /> {subscribingId === cls.id ? 'Setting...' : 'Notify Me'}
                      </button>
                    )}
                  </div>
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
                ) : (
                  cls.enrollmentStatus === 'completed' ? (
                    <p className="text-center text-sm text-gray-500">
                      <FaCheckCircle className="inline mr-1" /> Completed
                    </p>
                  ) : (
                    <p className="text-center text-sm text-gray-500">
                      <FaHourglassHalf className="inline mr-1" /> Class Ended
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
            Load More
          </button>
        )}
      </div>
    </StudentLayout>
  );
}
