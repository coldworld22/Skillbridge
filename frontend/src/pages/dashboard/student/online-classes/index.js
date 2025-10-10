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
  FaSortAmountDown
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
  const [reminderStatus, setReminderStatus] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchMyEnrolledClasses();
        setClasses(list);
      } catch (err) {
        console.error('Failed to load classes', err);
      }
    };
    load();
  }, []);

  const normalizeStatus = (status) => {
    const normalized = status ? status.toLowerCase() : 'upcoming';
    if (['live', 'in-progress', 'inprogress'].includes(normalized)) return 'ongoing';
    if (['finished', 'complete'].includes(normalized)) return 'completed';
    return normalized;
  };

  const filteredClasses = classes
    .filter((cls) =>
      filter === 'all' ? true : normalizeStatus(cls.scheduleStatus) === filter
    )
    .filter((cls) => (cls.title || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate) : null;
      const dateB = b.startDate ? new Date(b.startDate) : null;
      const valueA = dateA && !Number.isNaN(dateA.valueOf()) ? dateA : null;
      const valueB = dateB && !Number.isNaN(dateB.valueOf()) ? dateB : null;

      if (!valueA && !valueB) return 0;
      if (!valueA) return sortOrder === 'asc' ? 1 : -1;
      if (!valueB) return sortOrder === 'asc' ? -1 : 1;

      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
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
          {[
            { key: 'all', label: 'All' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'ongoing', label: 'Ongoing' },
            { key: 'completed', label: 'Completed' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                filter === key
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {label} ({
                key === 'all'
                  ? classes.length
                  : classes.filter(
                      (c) => normalizeStatus(c.scheduleStatus) === key
                    ).length
              })
            </button>
          ))}
        </div>

        {/* Class Cards */}
        {visibleClasses.length === 0 ? (
          <p className="text-gray-600 text-center">No classes found under this filter.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleClasses.map(cls => {
              const scheduleStatus = cls.scheduleStatus || 'Upcoming';
              const normalizedStatus = normalizeStatus(scheduleStatus);
              const statusLabel =
                {
                  upcoming: 'Upcoming',
                  ongoing: 'Ongoing',
                  completed: 'Completed',
                }[normalizedStatus] || scheduleStatus;
              const statusStyle =
                {
                  upcoming: 'bg-yellow-100 text-yellow-800',
                  ongoing: 'bg-green-100 text-green-800',
                  completed: 'bg-gray-200 text-gray-600',
                }[normalizedStatus] || 'bg-gray-200 text-gray-600';
              const startDate = cls.startDate ? new Date(cls.startDate) : null;
              const formattedStartDate =
                startDate && !Number.isNaN(startDate.valueOf())
                  ? startDate.toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Date TBA';
              const reminderState = reminderStatus[cls.id] || 'idle';

              return (
                <div key={cls.id} className="bg-gray-100 p-5 rounded-xl shadow-md">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800">
                      <FaChalkboardTeacher className="text-yellow-500" /> {cls.title}
                    </h2>
                    <FaEye className="text-gray-500 hover:text-gray-800 cursor-pointer mt-1" title="Preview" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Instructor: {cls.instructor}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                    <FaCalendarAlt /> {formattedStartDate}
                  </p>
                  <p className="flex items-center text-xs text-gray-500 mb-2">
                    <FaTags className="mr-1 text-gray-400" /> {cls.tags?.join(', ') || 'General'}
                  </p>
                  <div className="h-2 bg-gray-300 rounded-full mb-2">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${cls.progress || 0}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{cls.progress || 0}% completed</p>

                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-2 ${statusStyle}`}
                  >
                    {statusLabel}
                  </span>

                  {normalizedStatus === 'upcoming' && (
                    <button
                      onClick={async () => {
                        if (!cls.id || reminderState === 'loading') return;
                        setReminderStatus((prev) => ({ ...prev, [cls.id]: 'loading' }));
                        try {
                          await subscribeToClassReminder(cls.id);
                          setReminderStatus((prev) => ({ ...prev, [cls.id]: 'subscribed' }));
                          toast.success('You will be notified when the class goes live.');
                        } catch (err) {
                          console.error('Failed to subscribe to reminder', err);
                          setReminderStatus((prev) => ({ ...prev, [cls.id]: 'error' }));
                          toast.error('Unable to set reminder. Please try again later.');
                        }
                      }}
                      className="text-xs text-blue-600 underline mb-2 flex items-center gap-1 disabled:opacity-60"
                      disabled={reminderState === 'loading' || reminderState === 'subscribed'}
                    >
                      <FaBell />
                      {reminderState === 'subscribed' ? 'Reminder Set' : 'Notify Me'}
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
                  {normalizedStatus === 'ongoing' && cls.joined ? (
                    <Link
                      href={`/dashboard/student/online-classes/${cls.linkId || cls.id}`}
                      className="block bg-yellow-500 text-black text-center py-2 px-4 rounded hover:bg-yellow-600 font-semibold"
                    >
                      <FaVideo className="inline mr-2" /> Join Class
                    </Link>
                  ) : normalizedStatus === 'upcoming' ? (
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
              );
            })}
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
