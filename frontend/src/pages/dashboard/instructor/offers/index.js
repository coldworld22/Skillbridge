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
  FaFilter,
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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const { user } = useAuthStore();

  useEffect(() => {
    setIsLoading(true);
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
          price: o.budget ? `$${o.budget}` : "Not specified",
          duration: o.timeframe || "Flexible",
          status: o.status || "open",
          tags: o.tags || [],
          date: o.created_at
            ? new Date(o.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
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
      })
      .finally(() => setIsLoading(false));
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
    <div className="flex flex-col justify-between h-full bg-white border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300 p-6 rounded-xl group">
      <div
        className="cursor-pointer"
        onClick={() =>
          router.push(`/dashboard/instructor/offers/${offer.id}`)
        }
      >
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl">
            {offer.type === "student" ? (
              <FaUserGraduate className="text-blue-500 group-hover:text-blue-600 transition-colors" />
            ) : (
              <FaChalkboardTeacher className="text-green-500 group-hover:text-green-600 transition-colors" />
            )}
          </div>
          <div className="flex gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                offer.type === "student"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {offer.type === "student" ? "Student Request" : "My Offer"}
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                offer.status === "open"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {offer.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4">{offer.date}</p>

        <div className="space-y-2 mb-4">
          <div className="flex gap-2 items-center text-sm text-gray-600">
            <FaClock className="text-yellow-500 flex-shrink-0" />
            <span>{offer.duration}</span>
          </div>
          <div className="flex gap-2 items-center text-sm text-gray-600">
            <FaDollarSign className="text-yellow-500 flex-shrink-0" />
            <span>{offer.price}</span>
          </div>
        </div>
      </div>

      {offer.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 mt-auto border-t border-gray-100">
          {offer.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"
            >
              <FaTag className="text-xs" /> {tag}
            </span>
          ))}
          {offer.tags.length > 3 && (
            <span className="bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full text-xs">
              +{offer.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {offer.type === "student" && (
        <div className="mt-5">
          <button
<<<<<<< HEAD
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/website/pages/messages?to=${offer.userId}`);
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2.5 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md"
=======
            onClick={() =>
              router.push(`/messages?to=${offer.userId}`)
            }
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition"
>>>>>>> d5a0ac447d69c33243d59aa925280f69184bcfd4
          >
            Message Student
          </button>
        </div>
      )}
    </div>
  );

  return (
    <section className="w-full min-h-screen py-12 px-4 sm:px-6 bg-gray-50 text-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Instructor Offer Center
              </span>
            </h2>
            <p className="text-gray-600 mt-1">
              Manage your course offers and view student requests
            </p>
          </div>
          <Link href="/dashboard/instructor/offers/new" legacyBehavior>
            <a className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 px-5 py-2.5 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap">
              <FaPlus /> Post New Offer
            </a>
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search offers by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          <div className="relative w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white transition-all duration-200"
            >
              <option value="all">All Types</option>
              <option value="class">Class</option>
              <option value="tutorial">Tutorial</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* My Offers */}
        {!isLoading && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 p-2 rounded-full">
                  <FaChalkboardTeacher />
                </span>
                My Course Offers
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filteredMyOffers.length} {filteredMyOffers.length === 1 ? "offer" : "offers"}
              </span>
            </div>
            
            {myOffers.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <FaChalkboardTeacher className="inline-block text-4xl" />
                </div>
                <h4 className="text-lg font-medium text-gray-700 mb-1">No offers yet</h4>
                <p className="text-gray-500 mb-4">You haven't posted any course offers</p>
                <Link href="/dashboard/instructor/offers/new" legacyBehavior>
                  <a className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    <FaPlus /> Create your first offer
                  </a>
                </Link>
              </div>
            ) : filteredMyOffers.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <FaSearch className="inline-block text-4xl" />
                </div>
                <h4 className="text-lg font-medium text-gray-700 mb-1">No matches found</h4>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
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
                      className="bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Load More Offers
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Student Requests */}
        {!isLoading && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 p-2 rounded-full">
                  <FaUserGraduate />
                </span>
                Student Requests
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filteredStudentRequests.length} {filteredStudentRequests.length === 1 ? "request" : "requests"}
              </span>
            </div>
            
            {studentRequests.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <FaUserGraduate className="inline-block text-4xl" />
                </div>
                <h4 className="text-lg font-medium text-gray-700 mb-1">No student requests</h4>
                <p className="text-gray-500">Check back later for student learning requests</p>
              </div>
            ) : filteredStudentRequests.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <FaSearch className="inline-block text-4xl" />
                </div>
                <h4 className="text-lg font-medium text-gray-700 mb-1">No matches found</h4>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudentRequests.slice(0, visibleCount).map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

InstructorOfferDashboard.getLayout = (page) => (
  <InstructorLayout>{page}</InstructorLayout>
);

export default InstructorOfferDashboard;