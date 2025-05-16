// components/admin/tutorials/TutorialsTable.js
import { FaCheck, FaTimes, FaTrash, FaEye } from "react-icons/fa";

const tutorials = [
  {
    id: 1,
    title: "React Basics",
    instructor: "John Doe",
    category: "Frontend",
    price: "$25",
    status: "Pending",
  },
  {
    id: 2,
    title: "Mastering Python",
    instructor: "Sara Lee",
    category: "Backend",
    price: "Free",
    status: "Approved",
  },
  {
    id: 3,
    title: "UI/UX Design",
    instructor: "Ali Khan",
    category: "Design",
    price: "$15",
    status: "Rejected",
  },
];

export default function TutorialsTable() {
  return (
    <div className="bg-white p-6 rounded-xl shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">📚 All Tutorials</h2>
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm text-left text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Instructor</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tutorials.map((tut) => (
              <tr key={tut.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{tut.title}</td>
                <td className="px-4 py-2">{tut.instructor}</td>
                <td className="px-4 py-2">{tut.category}</td>
                <td className="px-4 py-2">{tut.price}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      tut.status === "Approved"
                        ? "bg-green-100 text-green-600"
                        : tut.status === "Pending"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {tut.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button title="View" className="text-blue-500 hover:text-blue-700">
                    <FaEye />
                  </button>
                  <button title="Approve" className="text-green-500 hover:text-green-700">
                    <FaCheck />
                  </button>
                  <button title="Reject" className="text-yellow-500 hover:text-yellow-700">
                    <FaTimes />
                  </button>
                  <button title="Delete" className="text-red-500 hover:text-red-700">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
