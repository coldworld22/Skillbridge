import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { motion } from "framer-motion";

// Dummy Data for Testing UI
const dummyLiveClasses = [
  {
    id: 1,
    title: "Live React.js Bootcamp",
    instructor: "John Doe",
    date: "March 25, 2025",
    time: "10:00 AM - 12:00 PM",
    price: 20,
    image: "/images/live/react-bootcamp.jpg",
  },
  {
    id: 2,
    title: "AI & Machine Learning Live Session",
    instructor: "Alice Smith",
    date: "April 5, 2025",
    time: "2:00 PM - 4:00 PM",
    price: 30,
    image: "/images/live/ai-session.jpg",
  },
];

const CheckoutPage = () => {
  const router = useRouter();
  const { id } = router.query; // ✅ Use "id" consistently
  const [liveClass, setLiveClass] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const foundClass = dummyLiveClasses.find((c) => c.id == id);
      setLiveClass(foundClass);
      setIsLoading(false);
    }
  }, [id]);

  // Simulate Payment Processing
  const handlePayment = () => {
    setIsLoading(true);
    setTimeout(() => {
      alert("Payment Successful! You are now registered.");
      router.push(`/online-classes/${id}`); // ✅ Use "id" to navigate
    }, 2000);
  };

  if (isLoading || !liveClass)
    return <p className="text-center text-white">Loading...</p>;

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />

      <div className="container mx-auto px-6 py-8 mt-16">
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-yellow-400">Checkout</h1>
          <p className="text-gray-300 mt-2">
            Secure your spot in this live class.
          </p>

          {/* Class Info */}
          <div className="mt-6 flex gap-4">
            <img
              src={liveClass.image}
              alt={liveClass.title}
              className="w-32 h-32 rounded-lg shadow-md"
            />
            <div>
              <h2 className="text-2xl font-semibold">{liveClass.title}</h2>
              <p className="text-gray-400">
                👨‍🏫 Instructor: {liveClass.instructor}
              </p>
              <p className="text-yellow-500">
                📅 {liveClass.date} | 🕒 {liveClass.time}
              </p>
              <p className="text-xl font-bold text-green-400 mt-2">
                💰 ${liveClass.price}
              </p>
            </div>
          </div>

          {/* Payment Options */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-yellow-400">
              Select Payment Method
            </h3>
            <div className="mt-3 space-y-3">
              <button
                onClick={handlePayment}
                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
              >
                Pay with Stripe
              </button>
              <button
                onClick={handlePayment}
                className="w-full bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition flex items-center justify-center gap-2"
              >
                Pay with PayPal
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
