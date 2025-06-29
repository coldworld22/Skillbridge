import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaClock,
  FaDollarSign,
  FaTag,
  FaPlus,
} from "react-icons/fa";

import { fetchOffers } from "@/services/offerService";
import useAuthStore from "@/store/auth/authStore";

const OfferBadge = ({ type }) => (
  <span
    className={`text-xs px-2 py-1 rounded-full font-semibold shadow-md uppercase tracking-wide ${
      type === "student" ? "bg-blue-600 text-white" : "bg-green-600 text-white"
    }`}
  >
    {type === "student" ? "Student Request" : "Instructor Offer"}
  </span>
);

const OffersIndex = () => {
  const [offers, setOffers] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchOffers()
      .then((data) => {
        const mapped = data.map((o) => ({
          id: o.id,
          type:
            o.student_role?.toLowerCase() === "instructor"
              ? "instructor"
              : "student",
          title: o.title,
          price: o.budget || "",
          duration: o.timeframe || "",
          tags: [],
          date: o.created_at
            ? new Date(o.created_at).toLocaleDateString()
            : "",
        }));
        setOffers(mapped);
      })
      .catch(() => setOffers([]));
  }, []);

  const offersToShow = offers.slice(0, visibleCount);
  const allVisible = visibleCount >= offers.length;

  const handleNavigate = (action, id) => {
    const role = user?.role?.toLowerCase();
    if (!role) {
      alert("You must register to continue.");
      return;
    }

    const routes = {
      student: "/dashboard/student/offers",
      instructor: "/dashboard/instructor/offers",
      admin: "/dashboard/admin/offers",
    };

    if (action === "post") {
      router.push(`${routes[role]}/new`);
    } else if (action === "dashboard") {
      router.push(routes[role]);
    } else if (action === "detail" && id) {
      router.push(`${routes[role]}/${id}`);
    }
  };

  return (
    <section className="min-h-screen py-16 px-6 bg-gray-950 text-white relative">
      <div className="max-w-7xl mx-auto">
        {/* Title & CTA */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-400 mb-4">
            🎓 Browse Student Requests & Instructor Offers
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">
            Students post help requests. Instructors offer courses. Engage and learn on your terms.
          </p>
          <button
            onClick={() => handleNavigate("post")}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto shadow-lg transition"
          >
            <FaPlus /> Post an Offer
          </button>
        </div>

        {/* Offer Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {offersToShow.map((offer) => (
            <div
              key={offer.id}
              onClick={() => handleNavigate("detail", offer.id)}
              className="bg-gray-800 hover:bg-gray-700 transition-all duration-300 cursor-pointer p-6 rounded-2xl shadow-lg group"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="text-2xl">
                  {offer.type === "student" ? (
                    <FaUserGraduate className="text-blue-400" />
                  ) : (
                    <FaChalkboardTeacher className="text-green-400" />
                  )}
                </div>
                <OfferBadge type={offer.type} />
              </div>
              <h3 className="text-lg font-bold text-yellow-300 mb-1 truncate">{offer.title}</h3>
              <p className="text-xs text-gray-400 mb-3">Posted: {offer.date}</p>
              <div className="text-sm text-gray-300 mb-1 flex items-center gap-2">
                <FaClock className="text-yellow-400" /> {offer.duration}
              </div>
              <div className="text-sm text-gray-300 mb-3 flex items-center gap-2">
                <FaDollarSign className="text-yellow-400" /> {offer.price}
              </div>
              <div className="flex flex-wrap gap-2">
                {offer.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="bg-yellow-500 text-black px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1"
                  >
                    <FaTag className="text-sm" /> {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Load More / Dashboard CTA */}
        <div className="text-center mt-14">
          {allVisible ? (
            <button
              onClick={() => handleNavigate("dashboard")}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-lg transition"
            >
              Go to Dashboard
            </button>
          ) : (
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-md transition"
            >
              Load More Offers
            </button>
          )}
        </div>
      </div>

      
    </section>
  );
};

export default OffersIndex;
