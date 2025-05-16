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
} from "react-icons/fa";
import InstructorLayout from "@/components/layouts/InstructorLayout";

const InstructorOfferDashboard = () => {
  const [myOffers, setMyOffers] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const router = useRouter();

  useEffect(() => {
    const mockOffers = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      userId: i % 2 === 0 ? "student1" : "instructor1",
      type: i % 2 === 0 ? "student" : "instructor",
      title: i % 2 === 0
        ? `Need Help with Subject ${i + 1}`
        : `Offering Course ${i + 1}`,
      price: `$${100 + i * 10}`,
      duration: `${1 + i % 6} months`,
      tags: ["Flexible", "LiveClass"].slice(0, (i % 2) + 1),
      date: `${i + 1} days ago`,
    }));

    setMyOffers(mockOffers.filter((o) => o.type === "instructor"));
    setStudentRequests(mockOffers.filter((o) => o.type === "student"));
  }, []);

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

        {/* My Offers */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-4">📦 My Course Offers</h3>
          {myOffers.length === 0 ? (
            <p className="text-gray-500">You haven’t posted any offers yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myOffers.slice(0, visibleCount).map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
              {visibleCount < myOffers.length && (
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
              {studentRequests.slice(0, visibleCount).map((offer) => (
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
