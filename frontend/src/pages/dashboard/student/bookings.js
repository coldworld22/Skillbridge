// pages/dashboard/student/bookings.js
import StudentLayout from '@/components/layouts/StudentLayout';
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { FaClock, FaCheckCircle, FaTimesCircle, FaComments } from 'react-icons/fa';

const mockBookings = [
    {
        id: 1,
        instructor: {
            name: 'Dr. John Doe',
            avatar: 'https://i.pravatar.cc/150?img=11'
        },
        subject: 'Python Basics',
        status: 'Pending',
        date: '2025-05-14',
        time: '10:00 AM'
    },
    {
        id: 2,
        instructor: {
            name: 'Jane Smith',
            avatar: 'https://i.pravatar.cc/150?img=12'
        },
        subject: 'React Fundamentals',
        status: 'Accepted',
        date: '2025-05-15',
        time: '03:00 PM'
    },
    {
        id: 3,
        instructor: {
            name: 'Dr. John Doe',
            avatar: 'https://i.pravatar.cc/150?img=11'
        },
        subject: 'Data Structures',
        status: 'Completed',
        date: '2025-05-10',
        time: '01:00 PM'
    }
];

export default function StudentBookingsPage() {
    const [activeTab, setActiveTab] = useState('All');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);

    const filtered = activeTab === 'All'
        ? mockBookings
        : mockBookings.filter(b => b.status === activeTab);

    const statusIcons = {
        Pending: <FaClock className="text-yellow-500" />,
        Accepted: <FaCheckCircle className="text-green-600" />,
        Completed: <FaCheckCircle className="text-blue-600" />,
        Cancelled: <FaTimesCircle className="text-red-500" />
    };

    return (
        <StudentLayout>
            <section className="py-10 px-4 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

                {/* Tabs */}
                <div className="flex gap-3 mb-6">
                    {['All', 'Pending', 'Accepted', 'Completed'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Booking Cards */}
                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <p className="text-gray-500">No bookings found.</p>
                    ) : (
                        filtered.map((booking) => (
                            <div
                                key={booking.id}
                                className="bg-white p-4 rounded-lg shadow flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    <img
                                        src={booking.instructor.avatar}
                                        alt={booking.instructor.name}
                                        className="w-12 h-12 rounded-full border"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            {booking.subject} with {booking.instructor.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {booking.date} at {booking.time}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {statusIcons[booking.status]}
                                    {booking.status === 'Accepted' && (
                                        <>
                                            <button
                                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                                                onClick={() => window.location.href = `/website/pages/messages?userId=${booking.instructor.name}`}
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
                                    {booking.status === 'Pending' && (
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
                {showCancelModal && (
                    <Dialog open={showCancelModal} onClose={() => setShowCancelModal(false)} className="relative z-50">
                        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <Dialog.Panel className="bg-white max-w-sm mx-auto rounded-lg shadow-lg p-6">
                                <Dialog.Title className="text-lg font-bold mb-4">Cancel Booking</Dialog.Title>
                                <p className="text-sm text-gray-700 mb-4">
                                    Are you sure you want to cancel your booking with <strong>{bookingToCancel?.instructor.name}</strong> for <strong>{bookingToCancel?.subject}</strong>?
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowCancelModal(false)}
                                        className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCancelModal(false);
                                            alert('Booking cancelled successfully');
                                        }}
                                        className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Confirm Cancel
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
