import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { motion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle, FaRedo, FaDownload, FaSync, FaArrowLeft } from "react-icons/fa";

const OrderDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const fetchedOrder = {
        id,
        course: "Mastering React.js",
        price: "$49",
        status: "Completed",
        date: "March 10, 2025",
        transactionId: "TXN789456",
        paymentMethod: "Credit Card",
        invoiceUrl: "/files/invoice-ORD123.pdf",
        estimatedDelivery: "March 20, 2025",
      };
      setOrder(fetchedOrder);
      setLoading(false);
    }, 1000);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-yellow-400 text-xl">
        <FaSync className="animate-spin mr-2" /> Loading Order Details...
      </div>
    );
  }

  if (!order) {
    return <div className="text-red-500 text-center text-xl">⚠ Order Not Found</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold text-yellow-400">📜 Order Details</h1>

        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Order #{order.id}</h2>
            <OrderStatusIcon status={order.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="bg-gray-700 p-4 rounded-lg shadow-md">
              <p className="text-lg"><strong>Course Name:</strong> {order.course}</p>
              <p className="text-lg"><strong>Price:</strong> {order.price}</p>
              <p className="text-lg"><strong>Payment Status:</strong> {order.status}</p>
              <p className="text-lg"><strong>Transaction ID:</strong> {order.transactionId}</p>
              <p className="text-lg"><strong>Payment Method:</strong> {order.paymentMethod}</p>
              <p className="text-lg"><strong>Purchase Date:</strong> {order.date}</p>

              {/* Show Estimated Delivery for Pending Orders */}
              {order.status === "Processing" && (
                <p className="text-yellow-400 mt-2"><strong>Estimated Completion:</strong> {order.estimatedDelivery}</p>
              )}
            </div>

            {/* Right Column */}
            <div className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col items-center">
              <h3 className="text-xl font-semibold text-yellow-400">Invoice</h3>
              <p className="text-gray-300 text-sm">Download your invoice for this order.</p>
              <a href={order.invoiceUrl} download className="mt-4">
                <button className="flex items-center gap-2 bg-yellow-500 px-4 py-2 rounded-lg hover:bg-yellow-600 transition">
                  <FaDownload /> Download Invoice
                </button>
              </a>
            </div>
          </div>

          {/* Back to Orders Button */}
          <div className="mt-6">
            <button 
              onClick={() => router.push("/profile/orders")} 
              className="flex items-center gap-2 bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              <FaArrowLeft /> Back to Orders
            </button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

// ✅ Improved OrderStatusIcon Component with Badges
const OrderStatusIcon = ({ status }) => {
  if (status === "Completed") {
    return <span className="bg-green-500 text-white px-3 py-1 rounded-md">Completed</span>;
  }
  if (status === "Processing") {
    return <span className="bg-yellow-500 text-white px-3 py-1 rounded-md animate-pulse">Processing</span>;
  }
  return <span className="bg-red-500 text-white px-3 py-1 rounded-md">Failed</span>;
};

export default OrderDetailsPage;
