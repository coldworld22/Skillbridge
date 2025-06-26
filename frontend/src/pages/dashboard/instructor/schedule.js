import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import CalendarView from "@/components/shared/CalendarView";
import useScheduleStore from "@/store/schedule/scheduleStore";

const mockBookings = [
  {
    id: 1,
    subject: "Python Basics",
    date: "2025-05-14",
    time: "10:00",
    status: "approved",
    student: {
      id: 101,
      name: "Alice Johnson",
      avatar: "https://i.pravatar.cc/150?img=1"
    },
    instructor: {
      id: 201,
      name: "Dr. John Doe",
      avatar: "https://i.pravatar.cc/150?img=11"
    }
  },
  {
    id: 2,
    subject: "React Fundamentals",
    date: "2025-05-15",
    time: "15:00",
    status: "approved",
    student: {
      id: 102,
      name: "Mark Lee",
      avatar: "https://i.pravatar.cc/150?img=2"
    },
    instructor: {
      id: 202,
      name: "Jane Smith",
      avatar: "https://i.pravatar.cc/150?img=12"
    }
  },
  {
    id: 3,
    subject: "Machine Learning",
    date: "2025-05-13",
    time: "13:00",
    status: "pending",
    student: {
      id: 101,
      name: "Alice Johnson",
      avatar: "https://i.pravatar.cc/150?img=1"
    },
    instructor: {
      id: 202,
      name: "Jane Smith",
      avatar: "https://i.pravatar.cc/150?img=12"
    }
  },
  {
    id: 4,
    subject: "Advanced JavaScript",
    date: "2025-05-17",
    time: "17:30",
    status: "declined",
    student: {
      id: 103,
      name: "Sara Kim",
      avatar: "https://i.pravatar.cc/150?img=3"
    },
    instructor: {
      id: 201,
      name: "Dr. John Doe",
      avatar: "https://i.pravatar.cc/150?img=11"
    }
  },
  {
    id: 5,
    subject: "Data Structures",
    date: "2025-05-18",
    time: "09:30",
    status: "approved",
    student: {
      id: 102,
      name: "Mark Lee",
      avatar: "https://i.pravatar.cc/150?img=2"
    },
    instructor: {
      id: 201,
      name: "Dr. John Doe",
      avatar: "https://i.pravatar.cc/150?img=11"
    }
  }
];


export default function InstructorSchedule() {
  const scheduleEvents = useScheduleStore((state) => state.events);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const confirmed = mockBookings
      .filter((b) => b.status === "approved")
      .map((b) => ({
        id: b.id,
        title: `${b.subject} · ${b.student.name}`,
        start: `${b.date}T${b.time}`,
        extendedProps: {
          student: b.student.name,
          subject: b.subject
        }
      }));

    setEvents([...confirmed, ...scheduleEvents]);
  }, [scheduleEvents]);

  return (
    <InstructorLayout>
      <CalendarView
        title="My Teaching Schedule"
        events={events}
        onEventClick={(info) => {
          const sub = info.event.extendedProps?.subject;
          const student = info.event.extendedProps?.student;
          if (sub && student) {
            alert(`📚 ${sub}\n👤 Student: ${student}`);
          } else {
            alert(info.event.title);
          }
        }}
      />
    </InstructorLayout>
  );
}
