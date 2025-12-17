import { useCallback, useEffect, useMemo, useState } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import BookingModal from '@/components/admin/bookings/BookingModal';
import BookingFilters from '@/components/admin/bookings/BookingFilters';
import BookingSummaryCard from '@/components/dashboard/bookings/BookingSummaryCard';
import StatusBadge from '@/components/shared/ui/StatusBadge';
import {
  fetchInstructorBookings,
  updateInstructorBooking,
} from '@/services/instructor/bookingService';
import { API_BASE_URL } from '@/config/config';
import { toast } from 'react-toastify';
import { CalendarCheck2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import nextI18NextConfig from '../../../../../next-i18next.config.js';

export default function InstructorBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const { t } = useTranslation('dashboard');

  const normalizeAvatar = useCallback((value, fallbackText) => {
    if (!value) {
      return `https://via.placeholder.com/40x40?text=${fallbackText}`;
    }

    return value.startsWith('http') ? value : `${API_BASE_URL}${value}`;
  }, [API_BASE_URL]);

  const formatBooking = useCallback(
    (booking) => {
      if (!booking) return null;

      const start = booking.start_time ? new Date(booking.start_time) : null;
      const end = booking.end_time ? new Date(booking.end_time) : null;

      return {
        id: booking.id,
        student: {
          name: booking.student_name || booking.student_id,
          avatar: normalizeAvatar(booking.student_avatar_url, 'S'),
        },
        instructor: {
          name: t('instructorBookingsPage.labels.you', 'You'),
          avatar: normalizeAvatar(booking.instructor_avatar_url, 'I'),
        },
        classTitle: booking.class_title || '—',
        date: start
          ? start.toLocaleDateString(undefined, { dateStyle: 'medium' })
          : '',
        time:
          start && end
            ? `${start.toLocaleTimeString(undefined, { timeStyle: 'short' })} - ${end.toLocaleTimeString(undefined, { timeStyle: 'short' })}`
            : start
            ? start.toLocaleTimeString(undefined, { timeStyle: 'short' })
            : '',
        duration:
          start && end
            ? t('instructorBookingsPage.labels.duration_minutes', '{{count}} mins', {
                count: Math.round((end.getTime() - start.getTime()) / 60000),
              })
            : '',
        status: (booking.status || '').toLowerCase(),
        notes: booking.notes,
        type: booking.class_title
          ? t('instructorBookingsPage.labels.class', 'Class')
          : t('instructorBookingsPage.labels.session', 'Session'),
      };
    },
    [normalizeAvatar, t]
  );

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      try {
        setError('');
        const data = await fetchInstructorBookings();
        if (!isMounted) return;
        setBookings((data || []).map(formatBooking).filter(Boolean));
      } catch (err) {
        console.error('Failed to load bookings', err);
        if (isMounted) {
          setError(
            t(
              'instructorBookingsPage.errors.load_failed',
              'Failed to load bookings. Please refresh to try again.'
            )
          );
          toast.error(
            t('instructorBookingsPage.toast.load_failed', 'Failed to load bookings')
          );
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
  }, [formatBooking, t]);

  const handleCancel = async (id, reason) => {
    try {
      await updateInstructorBooking(id, { status: 'cancelled', notes: reason });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: 'cancelled',
                notes: reason || b.notes,
              }
            : b
        )
      );
      toast.success(
        t('instructorBookingsPage.toast.cancelled', 'Booking cancelled')
      );
    } catch (err) {
      console.error('Cancel booking failed', err);
      toast.error(
        t('instructorBookingsPage.toast.cancel_failed', 'Failed to cancel booking')
      );
    }
  };

  const handleApprove = async (id) => {
    try {
      await updateInstructorBooking(id, { status: 'approved' });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: 'approved',
              }
            : b
        )
      );
      toast.success(
        t('instructorBookingsPage.toast.approved', 'Booking approved')
      );
    } catch (err) {
      console.error('Approve booking failed', err);
      toast.error(
        t('instructorBookingsPage.toast.approve_failed', 'Failed to approve booking')
      );
    }
  };

  const handleDecline = async (id, reason) => {
    try {
      await updateInstructorBooking(id, { status: 'declined', notes: reason });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: 'declined',
                notes: reason || b.notes,
              }
            : b
        )
      );
      toast.success(
        t('instructorBookingsPage.toast.declined', 'Booking declined')
      );
    } catch (err) {
      console.error('Decline booking failed', err);
      toast.error(
        t('instructorBookingsPage.toast.decline_failed', 'Failed to decline booking')
      );
    }
  };

  const handleComplete = async (id) => {
    try {
      await updateInstructorBooking(id, { status: 'completed' });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: 'completed',
              }
            : b
        )
      );
      toast.success(
        t('instructorBookingsPage.toast.completed', 'Booking marked as completed')
      );
    } catch (err) {
      console.error('Complete booking failed', err);
      toast.error(
        t('instructorBookingsPage.toast.complete_failed', 'Failed to complete booking')
      );
    }
  };

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();

    return bookings.filter((booking) => {
      const match =
        booking.student.name.toLowerCase().includes(keyword) ||
        booking.classTitle.toLowerCase().includes(keyword) ||
        booking.type.toLowerCase().includes(keyword);

      if (statusFilter === 'all') {
        return match;
      }

      return match && booking.status === statusFilter;
    });
  }, [bookings, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = {
      all: bookings.length,
      pending: 0,
      approved: 0,
      completed: 0,
      cancelled: 0,
      declined: 0,
    };

    bookings.forEach((booking) => {
      const status = (booking.status || '').toLowerCase();
      if (!status) return;
      counts[status] = (counts[status] ?? 0) + 1;
    });

    return counts;
  }, [bookings]);

  const summaryCards = useMemo(() => {
    const cards = [
      {
        key: 'all',
        label: t('instructorBookingsPage.summary.all', 'All bookings'),
        hint: t(
          'instructorBookingsPage.summary.all_hint',
          'Everything currently on your calendar'
        ),
        value: statusCounts.all ?? 0,
        icon: CalendarCheck2,
        gradient: 'from-sky-500 to-sky-400',
      },
      {
        key: 'pending',
        label: t('bookingStatuses.pending', 'Pending'),
        hint: t(
          'instructorBookingsPage.summary.pending_hint',
          'Waiting for your confirmation'
        ),
        value: statusCounts.pending ?? 0,
        icon: Clock,
        gradient: 'from-amber-500 to-amber-400',
      },
      {
        key: 'approved',
        label: t('bookingStatuses.approved', 'Approved'),
        hint: t(
          'instructorBookingsPage.summary.approved_hint',
          'Students already notified'
        ),
        value: statusCounts.approved ?? 0,
        icon: CheckCircle2,
        gradient: 'from-emerald-500 to-emerald-400',
      },
      {
        key: 'completed',
        label: t('bookingStatuses.completed', 'Completed'),
        hint: t(
          'instructorBookingsPage.summary.completed_hint',
          'Sessions you have already delivered'
        ),
        value: statusCounts.completed ?? 0,
        icon: CalendarCheck2,
        gradient: 'from-indigo-500 to-indigo-400',
      },
      {
        key: 'cancelled',
        label: t('bookingStatuses.cancelled', 'Cancelled'),
        hint: t(
          'instructorBookingsPage.summary.cancelled_hint',
          'Requests that were withdrawn or declined'
        ),
        value: statusCounts.cancelled ?? 0,
        icon: XCircle,
        gradient: 'from-rose-500 to-rose-400',
      },
    ];

    return cards.filter(
      (card) => card.key === 'all' || typeof statusCounts[card.key] === 'number'
    );
  }, [statusCounts, t]);

  const instructorStatusOptions = useMemo(
    () => [
      { label: t('instructorBookingsPage.filters.all', 'All'), value: 'all' },
      { label: t('bookingStatuses.pending', 'Pending'), value: 'pending' },
      { label: t('bookingStatuses.approved', 'Approved'), value: 'approved' },
      { label: t('bookingStatuses.completed', 'Completed'), value: 'completed' },
      { label: t('bookingStatuses.cancelled', 'Cancelled'), value: 'cancelled' },
      { label: t('bookingStatuses.declined', 'Declined'), value: 'declined' },
    ],
    [t]
  );

  const pageTitle = t('sidebar.my_bookings', 'My Bookings');
  const pageSubtitle = t(
    'instructorBookingsPage.subtitle',
    'Track your upcoming sessions, manage availability, and respond quickly to student requests.'
  );
  const emptyTitle = t(
    'instructorBookingsPage.empty.title',
    'No bookings match your filters.'
  );
  const emptyDescription = t(
    'instructorBookingsPage.empty.subtitle',
    'Try adjusting your filters to see more results.'
  );
  const tableHeaders = {
    student: t('instructorBookingsPage.table.student', 'Student'),
    class: t('instructorBookingsPage.table.class', 'Class'),
    date: t('instructorBookingsPage.table.date', 'Date'),
    time: t('instructorBookingsPage.table.time', 'Time'),
    status: t('instructorBookingsPage.table.status', 'Status'),
  };
  const metaLabels = {
    date: t('instructorBookingsPage.labels.date', 'Date'),
    time: t('instructorBookingsPage.labels.time', 'Time'),
    duration: t('instructorBookingsPage.labels.duration', 'Duration'),
  };

  return (
    <InstructorLayout>
      <section className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-500">{pageSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ key, label, hint, value, icon: Icon, gradient }) => {
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                aria-pressed={isActive}
                className={`group flex h-full w-full flex-col rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-500 ${
                  isActive ? 'border-yellow-400 ring-1 ring-yellow-300' : 'border-gray-100'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-inner`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="mt-4 text-2xl font-semibold text-gray-900">{value}</span>
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <span className="mt-2 text-xs text-gray-500">{hint}</span>
              </button>
            );
          })}
        </div>

        <BookingFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          statusCounts={statusCounts}
          options={instructorStatusOptions}
          searchPlaceholder={t(
            'instructorBookingsPage.search_placeholder',
            'Search by student or class'
          )}
          searchLabel={t('instructorBookingsPage.search_label', 'Search bookings')}
          statusLabel={t('instructorBookingsPage.status_label', 'Filter by status')}
        />

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100/60"
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">{tableHeaders.student}</th>
                      <th className="px-4 py-3">{tableHeaders.class}</th>
                      <th className="px-4 py-3">{tableHeaders.date}</th>
                      <th className="px-4 py-3">{tableHeaders.time}</th>
                      <th className="px-4 py-3">{tableHeaders.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((booking) => (
                      <tr
                        key={booking.id}
                        className="cursor-pointer border-t hover:bg-gray-50"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={booking.student.avatar}
                              className="h-9 w-9 rounded-full object-cover"
                              alt={`${booking.student.name} avatar`}
                            />
                            <div>
                              <p className="font-medium text-gray-900">{booking.student.name}</p>
                              <p className="text-xs text-gray-500">{booking.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{booking.classTitle}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{booking.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{booking.time}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={booking.status} />
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">
                          {emptyTitle}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4 md:hidden">
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
                  <p className="font-medium text-gray-700">{emptyTitle}</p>
                  <p className="mt-2 text-sm text-gray-500">{emptyDescription}</p>
                </div>
              ) : (
                filtered.map((booking) => (
                  <BookingSummaryCard
                    key={booking.id}
                    avatar={booking.student.avatar}
                    title={booking.student.name}
                    subtitle={t(
                      'instructorBookingsPage.labels.summary_meta',
                      '{{classTitle}} • {{type}}',
                      { classTitle: booking.classTitle, type: booking.type }
                    )}
                    status={booking.status}
                    meta={[
                      { label: metaLabels.date, value: booking.date },
                      { label: metaLabels.time, value: booking.time },
                      { label: metaLabels.duration, value: booking.duration },
                    ]}
                    note={booking.notes}
                    onClick={() => setSelectedBooking(booking)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {selectedBooking && (
          <BookingModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onCancel={handleCancel}
            onApprove={handleApprove}
            onDecline={handleDecline}
            onComplete={handleComplete}
          />
        )}
      </section>
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard', 'common'], nextI18NextConfig)),
    },
  };
}
