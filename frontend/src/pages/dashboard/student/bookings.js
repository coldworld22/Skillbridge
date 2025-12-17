// pages/dashboard/student/bookings.js
import StudentLayout from '@/components/layouts/StudentLayout';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog } from '@headlessui/react';
import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaComments,
  FaSpinner,
  FaTrashAlt,
} from 'react-icons/fa';
import {
  fetchStudentBookings,
  updateStudentBooking,
  deleteStudentBooking,
} from '@/services/student/bookingService';
import { API_BASE_URL } from '@/config/config';
import { toast } from 'react-toastify';
import StatusBadge from '@/components/shared/ui/StatusBadge';

export default function StudentBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [error, setError] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState(null);
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  const formatDateTimeForInput = useCallback((value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (num) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }, []);

  const normalizeBooking = useCallback((booking) => {
    if (!booking) return null;

    const avatar = booking.instructor_avatar_url || booking.instructor_avatar;
    const normalizedStatus = (booking.status || '').toLowerCase();

    return {
      ...booking,
      instructor_avatar: avatar
        ? avatar.startsWith('http')
          ? avatar
          : `${API_BASE_URL}${avatar}`
        : 'https://via.placeholder.com/48x48?text=I',
      status: normalizedStatus,
    };
  }, [API_BASE_URL]);

  const openRescheduleModal = (booking) => {
    setBookingToReschedule(booking);
    setRescheduleDateTime(formatDateTimeForInput(booking.start_time));
    setShowRescheduleModal(true);
  };

  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setBookingToReschedule(null);
    setRescheduleDateTime('');
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setBookingToCancel(null);
  };

  const submitReschedule = async () => {
    if (!bookingToReschedule) return;
    if (!rescheduleDateTime) {
      toast.error('Please pick a new start time.');
      return;
    }

    const start = new Date(rescheduleDateTime);
    if (Number.isNaN(start.getTime())) {
      toast.error('Invalid date/time. Please use the suggested format.');
      return;
    }

    const end = new Date(start.getTime() + 60 * 60 * 1000);

    try {
      setRescheduleSubmitting(true);
      await updateStudentBooking(bookingToReschedule.id, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'pending',
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingToReschedule.id
            ? normalizeBooking({
                ...b,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                status: 'pending',
              })
            : b
        )
      );
      toast.success('Booking rescheduled');
      closeRescheduleModal();
    } catch (error) {
      console.error('Failed to reschedule booking', error);
      toast.error('Unable to reschedule booking. Please try again.');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      try {
        setError('');
        const data = await fetchStudentBookings();
        if (!isMounted) return;
        setBookings((data || []).map(normalizeBooking));
      } catch (error) {
        console.error('Failed to load student bookings', error);
        if (isMounted) {
          setError('Failed to load bookings. Please refresh to try again.');
          toast.error('Failed to load bookings. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, [normalizeBooking]);

  const statusCounts = useMemo(() => {
    const counts = { all: bookings.length };
    bookings.forEach((booking) => {
      const status = (booking.status || '').toLowerCase();
      counts[status] = (counts[status] ?? 0) + 1;
    });
    return counts;
  }, [bookings]);

  const tabs = useMemo(
    () => ['All', 'pending', 'approved', 'completed', 'cancelled', 'declined'],
    []
  );

  const filtered = useMemo(() => {
    if (activeTab === 'All') return bookings;
    return bookings.filter((b) => (b.status || '').toLowerCase() === activeTab);
  }, [activeTab, bookings]);

  const statusIcons = {
    pending: <FaClock className="text-yellow-500" />,
    approved: <FaCheckCircle className="text-green-600" />,
    completed: <FaCheckCircle className="text-blue-600" />,
    cancelled: <FaTimesCircle className="text-red-500" />,
    declined: <FaTimesCircle className="text-red-500" />,
    rescheduled: <FaClock className="text-indigo-500" />,
  };

  const handleCancel = async () => {
    if (!bookingToCancel) return;
    try {
      await updateStudentBooking(bookingToCancel.id, { status: 'cancelled' });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingToCancel.id
            ? normalizeBooking({ ...b, status: 'cancelled' })
            : b
        )
      );
      toast.success('Booking cancelled');
    } catch (error) {
      console.error('Failed to cancel booking', error);
      toast.error('Unable to cancel booking. Please try again.');
    } finally {
      closeCancelModal();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking?')) return;

    try {
      await deleteStudentBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      toast.success('Booking deleted');
    } catch (error) {
      console.error('Failed to delete booking', error);
      toast.error('Unable to delete booking. Please try again.');
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-4xl text-yellow-600" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <section className="py-10 px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

        <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-700 border-transparent'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'All'
                ? ` (${statusCounts.all ?? 0})`
                : statusCounts[tab.toLowerCase()]
                  ? ` (${statusCounts[tab.toLowerCase()]})`
                  : ''}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-gray-500">No bookings found.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => {
              const start = new Date(booking.start_time);
              const end = booking.end_time ? new Date(booking.end_time) : null;

              return (
                <div
                  key={booking.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex flex-1 items-start gap-4">
                    <img
                      src={booking.instructor_avatar}
                      alt={booking.instructor_name || 'Instructor'}
                      className="h-14 w-14 rounded-full border border-gray-200 object-cover"
                    />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            {(booking.subject || booking.class_title || 'Session')} with{' '}
                            {booking.instructor_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {start.toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                            {end && (
                              <>
                                {' '}–{' '}
                                {end.toLocaleTimeString(undefined, {
                                  timeStyle: 'short',
                                })}
                              </>
                            )}
                          </p>
                        </div>
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                          {(statusIcons[booking.status] ?? (
                            <FaClock className="text-gray-400" />
                          ))}
                          <StatusBadge status={booking.status} />
                        </span>
                      </div>
                      {booking.notes && (
                        <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                          {booking.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    {booking.status === 'approved' && (
                      <>
                        <button
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                          onClick={() =>
                            (window.location.href = `/messages?userId=${booking.instructor_id}`)
                          }
                        >
                          <FaComments /> Chat
                        </button>
                        <button
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-yellow-500"
                          onClick={() => openRescheduleModal(booking)}
                        >
                          Reschedule
                        </button>
                      </>
                    )}
                    {booking.status === 'pending' && (
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
                        onClick={() => {
                          setBookingToCancel(booking);
                          setShowCancelModal(true);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
                      onClick={() => handleDelete(booking.id)}
                    >
                      <FaTrashAlt /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCancelModal && (
          <Dialog
            open={showCancelModal}
            onClose={closeCancelModal}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Cancel Booking
                </Dialog.Title>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to cancel your booking with{' '}
                  <strong>{bookingToCancel?.instructor_name}</strong>? This cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={closeCancelModal}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCancel}
                    className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                  >
                    Confirm Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}

        {showRescheduleModal && (
          <Dialog
            open={showRescheduleModal}
            onClose={closeRescheduleModal}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Reschedule Booking
                </Dialog.Title>
                <p className="mt-2 text-sm text-gray-600">
                  Pick a new start time for your session with{' '}
                  <strong>{bookingToReschedule?.instructor_name}</strong>. Bookings are one hour by default.
                </p>
                <label className="mt-4 block text-sm font-medium text-gray-700">
                  New start time
                  <input
                    type="datetime-local"
                    value={rescheduleDateTime}
                    onChange={(event) => setRescheduleDateTime(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={closeRescheduleModal}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                    disabled={rescheduleSubmitting}
                  >
                    Back
                  </button>
                  <button
                    onClick={submitReschedule}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                    disabled={rescheduleSubmitting}
                  >
                    {rescheduleSubmitting ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </section>
    </StudentLayout>
  );
}
