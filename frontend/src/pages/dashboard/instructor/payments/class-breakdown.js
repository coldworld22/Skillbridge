import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useState } from "react";

const mockClassEarnings = [
  {
    id: 1,
    title: "React Basics",
    publishStatus: "published",
    scheduleStatus: "Live",
    students: 20,
    price: 25,
    total: 500,
  },
  {
    id: 2,
    title: "Next.js Bootcamp",
    publishStatus: "published",
    scheduleStatus: "Completed",
    students: 30,
    price: 30,
    total: 900,
  },
  {
    id: 3,
    title: "Node.js Fundamentals",
    publishStatus: "draft",
    scheduleStatus: "Upcoming",
    students: 0,
    price: 40,
    total: 0,
  },
];

export default function InstructorClassEarningsPage() {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? mockClassEarnings
      : mockClassEarnings.filter(
          (cls) =>
            cls.scheduleStatus.toLowerCase() === filter ||
            cls.publishStatus.toLowerCase() === filter
        );

  return (
    <InstructorLayout>
      <div className="p-6 space-y-6 text-gray-800">
        <h1 className="text-2xl font-bold">📚 Class-Level Earnings</h1>

        <div className="flex gap-4">
          <label className="font-medium">Filter by Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="all">All</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Class</th>
                <th className="p-3">Schedule</th>
                <th className="p-3">Publish</th>
                <th className="p-3">Students</th>
                <th className="p-3">Price</th>
                <th className="p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cls) => (
                <tr key={cls.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{cls.title}</td>
                  <td className="p-3">{cls.scheduleStatus}</td>
                  <td className="p-3">{cls.publishStatus}</td>
                  <td className="p-3">{cls.students}</td>
                  <td className="p-3">${cls.price}</td>
                  <td className="p-3 font-semibold text-green-700">${cls.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </InstructorLayout>
  );
}
