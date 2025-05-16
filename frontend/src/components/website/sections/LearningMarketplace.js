import { useState } from "react";
import { useRouter } from "next/router";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaClock,
  FaDollarSign,
  FaTag,
  FaPlus,
} from "react-icons/fa";

const mockOffers = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  type: i % 2 === 0 ? "student" : "instructor",
  title: i % 2 === 0 ? "Need Chemistry Help" : "English Tutoring Available",
  price: `$${100 + i * 5}`,
  duration: `${1 + (i % 6)} months`,
  tags: ["Flexible", "Urgent"].slice(0, (i % 2) + 1),
  date: `${i + 1} days ago`,
}));

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
  const [visibleCount, setVisibleCount] = useState(6);
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(""); // "post" | "dashboard" | "detail"
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const router = useRouter();

  const offersToShow = mockOffers.slice(0, visibleCount);
  const allVisible = visibleCount >= mockOffers.length;

  const handleRoleSelection = (role) => {
    setShowModal(false);
    if (role === "guest") {
      alert("You must register to continue.");
      return;
    }

    const routes = {
      student: "/dashboard/student/offers",
      instructor: "/dashboard/instructor/offers",
      admin: "/dashboard/admin/offers",
    };

    if (pendingAction === "post") {
      router.push(`${routes[role]}/new`);
    } else if (pendingAction === "dashboard") {
      router.push(routes[role]);
    } else if (pendingAction === "detail" && selectedOfferId) {
      router.push(`${routes[role]}/${selectedOfferId}`);
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
            onClick={() => {
              setPendingAction("post");
              setShowModal(true);
            }}
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
              onClick={() => {
                setSelectedOfferId(offer.id);
                setPendingAction("detail");
                setShowModal(true);
              }}
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
              onClick={() => {
                setPendingAction("dashboard");
                setShowModal(true);
              }}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 p-8 rounded-xl w-full max-w-md shadow-2xl text-center">
            <h2 className="text-2xl font-bold mb-6">Who are you?</h2>
            <div className="space-y-3">
              {[
                { label: "👤 I am a Guest", value: "guest", style: "gray" },
                { label: "🎓 I am a Student", value: "student", style: "blue" },
                { label: "🧑‍🏫 I am an Instructor", value: "instructor", style: "green" },
                { label: "🛡️ I am an Admin", value: "admin", style: "yellow" },
              ].map(({ label, value, style }) => (
                <button
                  key={value}
                  onClick={() => handleRoleSelection(value)}
                  className={`w-full border border-${style}-500 text-${style}-700 hover:bg-${style}-100 px-4 py-2 rounded transition`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default OffersIndex;
