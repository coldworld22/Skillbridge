import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { motion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle, FaRedo, FaSync, FaSort, FaFilter, FaShoppingCart, FaEye } from "react-icons/fa";

const OrdersPage = () => {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("Newest");

  useEffect(() => {
    setTimeout(() => {
      try {
        const fetchedOrders = [
          { id: "ORD123", course: "Mastering React.js", price: "$49", status: "Completed", date: "March 10, 2025" },
          { id: "ORD124", course: "Python for Data Science", price: "$39", status: "Processing", date: "March 15, 2025" },
          { id: "ORD125", course: "AI & Machine Learning Bootcamp", price: "$59", status: "Failed", date: "March 18, 2025" },
        ];
        setOrders(fetchedOrders);
      } catch (error) {
        setError("Failed to load orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    }, 1500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-yellow-400 text-xl">
        <FaSync className="animate-spin mr-2" /> Loading Orders...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500">
        <p>{error}</p>
        <button onClick={() => location.reload()} className="mt-3 bg-red-500 text-white px-4 py-2 rounded-md">
          Retry
        </button>
      </div>
    );
  }

  // ✅ Apply Filtering & Sorting
  const filteredOrders = orders.filter((order) =>
    statusFilter === "All" ? true : order.status === statusFilter
  );

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    return sortOrder === "Newest"
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date);
  });

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg mt-0 pt-28">
        <h1 className="text-3xl font-bold text-yellow-400">📦 My Orders</h1>
        <p className="text-gray-300">Track your past purchases and payment status.</p>

        {/* 📜 Order Summary */}
        <div className="mt-4 text-gray-300">
          <p>Total Orders: {orders.length}</p>
          <p>
            ✅ Completed: {orders.filter(o => o.status === "Completed").length} |
            🔄 Processing: {orders.filter(o => o.status === "Processing").length} |
            ❌ Failed: {orders.filter(o => o.status === "Failed").length}
          </p>
        </div>

        {/* 🛠️ Filters & Sorting */}
        <div className="flex justify-between items-center mt-6">
          <select
            className="bg-gray-700 p-2 rounded text-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Orders</option>
            <option value="Completed">Completed</option>
            <option value="Processing">Processing</option>
            <option value="Failed">Failed</option>
          </select>

          <button
            className="flex items-center gap-2 bg-gray-700 p-2 rounded text-white"
            onClick={() => setSortOrder(sortOrder === "Newest" ? "Oldest" : "Newest")}
          >
            <FaSort /> {sortOrder === "Newest" ? "Sort: Newest" : "Sort: Oldest"}
          </button>
        </div>

        {/* 📦 Orders List */}
        {sortedOrders.length === 0 ? (
          <p className="text-gray-400 mt-4">No orders found.</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6"
          >
            <table className="w-full text-left border border-gray-700">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-700">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="p-3">
                      <Link href={`/profile/orders/${order.id}`} className="text-yellow-400 hover:underline">{order.id}</Link>
                    </td>
                    <td className="p-3">{order.course}</td>
                    <td className="p-3">{order.price}</td>
                    <td className="p-3 flex items-center gap-2">
                      <OrderStatusIcon status={order.status} /> {order.status}
                    </td>
                    <td className="p-3">{order.date}</td>
                    <td className="p-3 flex gap-2">
                      <Link href={`/profile/orders/${order.id}`} className="bg-blue-500 px-3 py-1 text-white rounded-md hover:bg-blue-600 flex items-center gap-1">
                        <FaEye /> View
                      </Link>
                      {order.status === "Failed" && (
                        <button className="bg-red-500 px-3 py-1 text-white rounded-md hover:bg-red-600">Retry</button>
                      )}
                      {order.status === "Completed" && (
                        <button className="bg-green-500 px-3 py-1 text-white rounded-md hover:bg-green-600">Reorder</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
};

const OrderStatusIcon = ({ status }) => {
  if (status === "Completed") return <FaCheckCircle className="text-green-500 text-lg" />;
  if (status === "Processing") return <FaRedo className="text-yellow-500 text-lg animate-spin" />;
  return <FaTimesCircle className="text-red-500 text-lg" />;
};

export default OrdersPage;
