// pages/dashboard/student/bookings.js
import StudentLayout from '@/components/layouts/StudentLayout';
import { useEffect, useState } from 'react';

import { useRouter } from 'next/router';
import { Dialog } from '@headlessui/react';
import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaComments,
  FaSpinner,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { fetchStudentBookings, updateStudentBooking } from '@/services/student/bookingService';
import useAuthStore from '@/store/auth/authStore';

export default function StudentBookingsPage() {
  const router = useRouter();
  const { accessToken, user, hasHydrated } = useAuthStore();

  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!accessToken || !user) {
      router.replace('/auth/login');
      return;
    }

    if (user.role?.toLowerCase() !== 'student') {
      router.replace('/403');
      return;
    }

    fetchStudentBookings()
      .then(setBookings)
      .catch((err) => {
        console.error('Failed to load bookings', err);
        toast.error('Failed to load bookings');
      })
      .finally(() => setLoading(false));
  }, [accessToken, hasHydrated, router, user]);


  const filtered = activeTab === 'All' ? bookings : bookings.filter(b => b.status === activeTab);

  const statusIcons = {
    pending: <FaClock className="text-yellow-500" />,
    approved: <FaCheckCircle className="text-green-600" />,
    completed: <FaCheckCircle className="text-blue-600" />,
    cancelled: <FaTimesCircle className="text-red-500" />,
    declined: <FaTimesCircle className="text-red-500" />,
  };

  const handleCancel = async () => {
    if (!bookingToCancel) return;
    await updateStudentBooking(bookingToCancel.id, { status: 'cancelled' });
    setBookings(prev => prev.map(b => (b.id === bookingToCancel.id ? { ...b, status: 'cancelled' } : b)));
    setShowCancelModal(false);
  };

  if (!hasHydrated) {
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

        <div className="flex gap-3 mb-6">
          {['All', 'pending', 'approved', 'completed', 'cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <p className="text-gray-500">No bookings found.</p>
            ) : (
              filtered.map(booking => (
                <div key={booking.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={booking.instructor_avatar} alt={booking.instructor_name} className="w-12 h-12 rounded-full border" />
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {booking.subject} with {booking.instructor_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.start_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusIcons[booking.status]}
                    {booking.status === 'approved' && (
                      <>

                        <button
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                          onClick={() => (window.location.href = `/website/pages/messages?userId=${booking.instructor_id}`)}
                        >
                          <FaComments className="inline mr-1" /> Chat
                        </button>
                        <button
                          className="bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500 text-sm"
                          onClick={() => alert('Reschedule requested')}
                        >
                          Reschedule
                        </button>

                      </>
                    )}
                    {booking.status === 'pending' && (
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                        onClick={() => {
                          setBookingToCancel(booking);
                          setShowCancelModal(true);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showCancelModal && (
          <Dialog open={showCancelModal} onClose={() => setShowCancelModal(false)} className="relative z-50">
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="bg-white max-w-sm mx-auto rounded-lg shadow-lg p-6">
                <Dialog.Title className="text-lg font-bold mb-4">Cancel Booking</Dialog.Title>
                <p className="text-sm text-gray-700 mb-4">
                  Are you sure you want to cancel your booking with <strong>{bookingToCancel?.instructor_name}</strong>?
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-100">Back</button>
                  <button onClick={handleCancel} className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600">Confirm Cancel</button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </section>
    </StudentLayout>
  );
}

