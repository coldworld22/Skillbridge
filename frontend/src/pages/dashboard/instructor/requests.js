import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import RequestCard from "@/components/instructors/requests/RequestCard";
import {
  fetchInstructorBookings,
  updateInstructorBooking,
} from "@/services/instructor/bookingService";



const tabs = ["All", "pending", "approved", "declined"];

export default function InstructorRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await fetchInstructorBookings();
        const formatted = (data || []).map((b) => ({
          id: b.id,
          student: {
            id: b.student_id,
            name: b.student_name || b.student_id,
            avatar:
              b.student_avatar_url ||
              "https://via.placeholder.com/40x40?text=S",
          },
          subject: b.notes || b.class_title || "—",
          date: b.start_time
            ? new Date(b.start_time).toLocaleString()
            : "",
          status: b.status,
        }));
        setRequests(formatted);
      } catch (err) {
        console.error("Failed to load requests", err);
        setRequests([]);
      }
    };
    loadRequests();
  }, []);

  const handleStatusChange = (id, newStatus) => {
    updateInstructorBooking(id, { status: newStatus })
      .then(() => {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: newStatus } : r
          )
        );
      })
      .catch((err) => {
        console.error("Status update failed", err);
      });
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
                  window.location.href = `/messages?userId=${req.student.id}`
                }
              />
            ))
          )}
        </div>
      </section>
    </InstructorLayout>
  );
}
