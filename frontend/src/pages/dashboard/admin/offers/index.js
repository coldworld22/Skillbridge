import { useEffect, useState } from "react";
import {
  FaSearch,
  FaEye,
  FaTrashAlt,
  FaUserShield,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import {
  fetchOffers,
  updateOffer,
  deleteOffer,
} from "@/services/admin/offerService";

const AdminOfferDashboard = () => {
  const [offers, setOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [filterRole, setFilterRole] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 5;

  useEffect(() => {
    fetchOffers()
      .then((data) => {
        const mapped = data.map((o) => ({
          id: o.id,
          title: o.title,
          user: {
            id: o.student_id,
            name: o.student_name,
            role: o.student_role,
            avatar: o.student_avatar
              ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${o.student_avatar}`
              : "/avatars/default.jpg",
          },
          type: o.student_role?.toLowerCase() === "instructor" ? "instructor" : "student",
          status: o.status || "open",
          date: o.created_at ? new Date(o.created_at).toLocaleDateString() : "",
        }));
        setOffers(mapped);
      })
      .catch(() => setOffers([]));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this offer?")) return;
    setOffers((prev) => prev.filter((o) => o.id !== id));
    try {
      await deleteOffer(id);
    } catch (_) {}
  };

  const handleToggleStatus = async (id) => {
    const offer = offers.find((o) => o.id === id);
    if (!offer) return;
    const newStatus = offer.status === "open" ? "closed" : "open";
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
    try {
      await updateOffer(id, { status: newStatus });
    } catch (_) {}
  };

  const filtered = offers
    .filter((o) => o.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((o) => (filterRole ? o.type === filterRole : true))
    .sort((a, b) => (sortAsc ? a.id - b.id : b.id - a.id));

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">📋 Admin: Manage All Offers</h1>

        <div className="flex flex-wrap items-center gap-3">
          <select
            onChange={(e) => setFilterRole(e.target.value)}
            value={filterRole}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="">All Roles</option>
            <option value="instructor">Instructor</option>
            <option value="student">Student</option>
          </select>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="text-sm px-3 py-1 bg-gray-100 border rounded text-gray-700 hover:bg-gray-200 flex items-center gap-1"
          >
            {sortAsc ? <FaSortAmountDown /> : <FaSortAmountUp />} Sort by ID
          </button>

          <div className="flex items-center border border-gray-300 rounded px-2 py-1 bg-white shadow-sm">
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="outline-none text-sm w-48"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-gray-100 text-left uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((offer) => (
              <tr key={offer.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium truncate max-w-xs">{offer.title}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={offer.user.avatar}
                      alt={offer.user.name}
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                    <div>
                      <p className="font-semibold">{offer.user.name}</p>
                      <p className="text-xs text-gray-500">{offer.user.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    offer.type === "instructor"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {offer.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div
                    onClick={() => handleToggleStatus(offer.id)}
                    className={`cursor-pointer inline-block w-14 h-7 flex items-center bg-gray-200 rounded-full p-1 transition duration-300 ${
                      offer.status === "open" ? "bg-green-400" : "bg-red-400"
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                        offer.status === "open" ? "translate-x-7" : "translate-x-0"
                      }`}
                    ></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{offer.date}</td>
                <td className="px-4 py-3 text-right flex justify-end gap-2">
                  <Link href={`/dashboard/admin/offers/${offer.id}`}>
                    <button className="text-blue-600 hover:text-blue-800" title="View">
                      <FaEye />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete Offer"
                  >
                    <FaTrashAlt />
                  </button>
                  <button className="text-yellow-600 hover:text-yellow-800" title="Flag User">
                    <FaUserShield />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-6 gap-3">
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          disabled={page * perPage >= filtered.length}
          onClick={() => setPage((prev) => prev + 1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

AdminOfferDashboard.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;
export default AdminOfferDashboard;
