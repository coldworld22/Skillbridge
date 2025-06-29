import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FaPlus,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaTag,
  FaClock,
  FaDollarSign,
  FaSearch,
} from "react-icons/fa";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchOffers } from "@/services/offerService";
import useAuthStore from "@/store/auth/authStore";

const InstructorOfferDashboard = () => {
  const [myOffers, setMyOffers] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const router = useRouter();

  const { user } = useAuthStore();

  useEffect(() => {
    fetchOffers()
      .then((data) => {
        const mapped = data.map((o) => ({
          id: o.id,
          userId: o.student_id,
          type:
            o.student_role?.toLowerCase() === "instructor"
              ? "instructor"
              : "student",
          offerType: o.offer_type,
          title: o.title,
          price: o.budget || "",
          duration: o.timeframe || "",
          tags: [],
          date: o.created_at
            ? new Date(o.created_at).toLocaleDateString()
            : "",
        }));

        setMyOffers(
          mapped.filter(
            (o) => o.type === "instructor" && o.userId === user?.id
          )
        );
        setStudentRequests(mapped.filter((o) => o.type === "student"));
      })
      .catch(() => {
        setMyOffers([]);
        setStudentRequests([]);
      });
  }, [user?.id]);

  const filteredMyOffers = myOffers
    .filter((o) =>
      o.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((o) =>
      typeFilter === "all" ? true : o.offerType === typeFilter
    );

  const filteredStudentRequests = studentRequests
    .filter((o) =>
      o.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((o) =>
      typeFilter === "all" ? true : o.offerType === typeFilter
    );

  const OfferCard = ({ offer }) => (
    <div className="flex flex-col justify-between h-full bg-white border border-gray-200 hover:shadow-xl transition-all p-5 rounded-xl">
      <div
        className="cursor-pointer"
        onClick={() =>
          router.push(`/dashboard/instructor/offers/${offer.id}`)
        }
      >
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl">
            {offer.type === "student" ? (
              <FaUserGraduate className="text-blue-500" />
            ) : (
              <FaChalkboardTeacher className="text-green-500" />
            )}
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium shadow ${
              offer.type === "student"
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {offer.type === "student" ? "Student Request" : "My Offer"}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
          {offer.title}
        </h3>
        <p className="text-sm text-gray-500 mb-3">{offer.date}</p>

        <div className="flex gap-2 items-center text-sm text-gray-600 mb-1">
          <FaClock className="text-yellow-500" /> {offer.duration}
        </div>
        <div className="flex gap-2 items-center text-sm text-gray-600 mb-3">
          <FaDollarSign className="text-yellow-500" /> {offer.price}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs pt-3 border-t border-gray-100">
        {offer.tags.map((tag, index) => (
          <span
            key={index}
            className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium flex items-center gap-1"
          >
            <FaTag className="text-xs" /> {tag}
          </span>
        ))}
      </div>

      {/* ✅ Message button on student requests */}
      {offer.type === "student" && (
        <div className="mt-4">
          <button
            onClick={() =>
              router.push(`/website/pages/messages?to=${offer.userId}`)
            }
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition"
          >
            Message Student
          </button>
        </div>
      )}
    </div>
  );

  return (
    <section className="w-full min-h-screen py-12 px-6 bg-gray-50 text-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            🧑‍🏫 Instructor Offer Center
          </h2>
          <Link href="/dashboard/instructor/offers/new">
            <button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 font-semibold rounded-lg shadow">
              <FaPlus /> Post New Course Offer
            </button>
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2 border rounded px-3 py-2 w-full sm:max-w-xs">
            <FaSearch className="text-gray-500" />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 border rounded w-full sm:w-auto"
          >
            <option value="all">All Types</option>
            <option value="class">Class</option>
            <option value="tutorial">Tutorial</option>
          </select>
        </div>

        {/* My Offers */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-4">📦 My Course Offers</h3>
          {myOffers.length === 0 ? (
            <p className="text-gray-500">You haven’t posted any offers yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMyOffers.slice(0, visibleCount).map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
              {visibleCount < filteredMyOffers.length && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Student Requests */}
        <div>
          <h3 className="text-xl font-semibold mb-4">🎓 Student Requests</h3>
          {studentRequests.length === 0 ? (
            <p className="text-gray-500">No student requests available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudentRequests.slice(0, visibleCount).map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// ✅ Attach Instructor Layout
InstructorOfferDashboard.getLayout = (page) => (
  <InstructorLayout>{page}</InstructorLayout>
);

export default InstructorOfferDashboard;
