import { useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import RequestCard from "@/components/instructors/requests/RequestCard";



const mockRequests = [
  {
    id: 1,
    student: {
      id: 101,
      name: "Alice Johnson",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    subject: "Intro to Python",
    date: "2025-05-12 10:00 AM",
    status: "pending",
  },
  {
    id: 2,
    student: {
      id: 102,
      name: "Mark Lee",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    subject: "React Components",
    date: "2025-05-13 3:00 PM",
    status: "approved",
  },
  {
    id: 3,
    student: {
      id: 103,
      name: "Sara Kim",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    subject: "Machine Learning Basics",
    date: "2025-05-14 1:00 PM",
    status: "declined",
  },
];

const tabs = ["All", "pending", "approved", "declined"];

export default function InstructorRequestsPage() {
  const [requests, setRequests] = useState(mockRequests);
  const [activeTab, setActiveTab] = useState("All");

  const handleStatusChange = (id, newStatus) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: newStatus } : r
      )
    );
  };

  const filtered = activeTab === "All"
    ? requests
    : requests.filter((r) => r.status === activeTab);

  return (
    <InstructorLayout>
      <section className="py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">Booking Requests</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-full text-sm font-medium border ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Request Grid */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-gray-500">No requests in this category.</p>
          ) : (
            filtered.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onAccept={() => handleStatusChange(req.id, "approved")}
                onDecline={() => handleStatusChange(req.id, "declined")}
                onChat={() =>
                  window.location.href = `/website/pages/messages?userId=${req.student.id}`
                }
              />
            ))
          )}
        </div>
      </section>
    </InstructorLayout>
  );
}
