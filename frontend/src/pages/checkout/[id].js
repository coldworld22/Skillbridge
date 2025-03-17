import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

// Dummy Data (Replace with API later)
const dummyLiveClasses = [
  {
    id: "1",
    title: "Live React.js Bootcamp",
    instructor: "John Doe",
    date: "March 25, 2025",
    time: "10:00 AM - 12:00 PM",
    price: 20,
  },
  {
    id: "2",
    title: "AI & Machine Learning Live Session",
    instructor: "Alice Smith",
    date: "April 5, 2025",
    time: "2:00 PM - 4:00 PM",
    price: 30,
  },
];

const CheckoutPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [liveClass, setLiveClass] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const foundClass = dummyLiveClasses.find((c) => c.id === id);
      setLiveClass(foundClass || null);
    }
  }, [id]);

  const handlePayment = () => {
    setLoading(true);
    setTimeout(() => {
      alert("✅ Payment Successful! Redirecting to Live Class...");
      router.push(`/live-streams/${id}`); // 🔗 Redirect to Live Session
    }, 2000);
  };

  if (!liveClass) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <p>⚠️ Class Not Found</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-12">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-400">💳 Checkout</h1>
          <p className="text-gray-300 mt-2">Complete your payment to access the class.</p>

          {/* Class Info */}
          <div className="mt-6 flex gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{liveClass.title}</h2>
              <p className="text-gray-400">👨‍🏫 Instructor: {liveClass.instructor}</p>
              <p className="text-yellow-500">📅 {liveClass.date} | 🕒 {liveClass.time}</p>
              <p className="text-xl font-bold text-green-400 mt-2">💰 ${liveClass.price}</p>
            </div>
          </div>

          {/* Payment Button */}
          <div className="mt-6">
            <button
              onClick={handlePayment}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? "Processing Payment..." : "💳 Pay & Join Live Class"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
