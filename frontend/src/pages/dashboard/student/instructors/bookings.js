import { useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import BookingCard from "@/components/student/instructors/BookingCard";

const mockBookings = [
  {
    id: 101,
    instructor: {
      id: 1,
      name: "Dr. John Doe",
      avatar: "https://www.iwcf.org/wp-content/uploads/2018/12/Instructor-top-of-page-image-new.jpg",
    },
    subject: "Intro to Python",
    date: "2025-05-15",
    status: "pending",
  },
  {
    id: 102,
    instructor: {
      id: 2,
      name: "Jane Smith",
      avatar: "https://media.istockphoto.com/id/1468138682/photo/happy-elementary-teacher-in-front-of-his-students-in-the-classroom.jpg",
    },
    subject: "React Components",
    date: "2025-05-10",
    status: "approved",
  },
  {
    id: 103,
    instructor: {
      id: 1,
      name: "Dr. John Doe",
      avatar: "https://www.iwcf.org/wp-content/uploads/2018/12/Instructor-top-of-page-image-new.jpg",
    },
    subject: "Data Visualization",
    date: "2025-04-25",
    status: "completed",
  },
];

export default function StudentBookings() {
  const [bookings, setBookings] = useState(mockBookings);

  const handleCancel = (id) => {
    const confirm = window.confirm("Are you sure you want to cancel this request?");
    if (confirm) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleChat = (instructorId) => {
    window.location.href = `/messages?userId=${instructorId}`;
  };

  return (
    <StudentLayout>
      <section className="py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <p className="text-gray-600 text-center">No bookings yet.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onCancel={() => handleCancel(b.id)}
                onChat={() => handleChat(b.instructor.id)}
              />
            ))}
          </div>
        )}
      </section>
    </StudentLayout>
  );
}
