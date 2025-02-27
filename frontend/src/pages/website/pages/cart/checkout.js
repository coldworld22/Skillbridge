import { useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import { motion } from "framer-motion";
import { useRouter } from "next/router"; // ✅ For Redirecting After Payment
import {
  FaCreditCard, FaPaypal, FaBitcoin, FaEthereum, FaCheckCircle,
} from "react-icons/fa";
import Link from "next/link";

const CheckoutPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [billingInfo, setBillingInfo] = useState({ fullName: "", email: "", address: "" });
  const [errors, setErrors] = useState({});
  const router = useRouter(); // ✅ To redirect after payment

  // Validate form before placing order
  const validateForm = () => {
    let newErrors = {};
    if (!billingInfo.fullName) newErrors.fullName = "Full Name is required";
    if (!billingInfo.email.includes("@")) newErrors.email = "Valid Email is required";
    if (!billingInfo.address) newErrors.address = "Billing Address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Simulate payment and redirect
  const handlePayment = () => {
    if (!validateForm()) return;
    alert("✅ Payment Processed! Redirecting...");
    setTimeout(() => {
      router.push("/website/pages/cart/confirmation"); // ✅ Redirect after "payment"
    }, 1500);
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <main className="pt-24 pb-12 container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-6 text-center">🛍️ Checkout</h1>

        {/* Order Summary */}
        <div className="bg-gray-900 shadow-md rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span>🛒 Premium Course</span>
            <span>$50.00</span>
          </div>
          <div className="flex justify-between border-b border-gray-700 pb-2 mt-2">
            <span>📖 E-Book</span>
            <span>$20.00</span>
          </div>
          <div className="flex justify-between text-yellow-500 text-lg font-bold mt-4">
            <span>Total:</span>
            <span>$70.00</span>
          </div>
        </div>

        {/* Billing Information */}
        <div className="bg-gray-900 shadow-md rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Billing Information</h2>
          <input
            type="text"
            placeholder="Full Name"
            value={billingInfo.fullName}
            onChange={(e) => setBillingInfo({ ...billingInfo, fullName: e.target.value })}
            className="w-full p-3 bg-gray-800 text-white rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          {errors.fullName && <p className="text-red-500">{errors.fullName}</p>}

          <input
            type="email"
            placeholder="Email Address"
            value={billingInfo.email}
            onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
            className="w-full p-3 bg-gray-800 text-white rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          {errors.email && <p className="text-red-500">{errors.email}</p>}

          <input
            type="text"
            placeholder="Billing Address"
            value={billingInfo.address}
            onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
            className="w-full p-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          {errors.address && <p className="text-red-500">{errors.address}</p>}
        </div>

        {/* Payment Method Selection */}
        <div className="bg-gray-900 shadow-md rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Payment Method</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod("credit_card")}
              className={`p-3 flex items-center gap-2 rounded-lg ${
                paymentMethod === "credit_card" ? "bg-yellow-500 text-black" : "bg-gray-800 text-white"
              }`}
            >
              <FaCreditCard /> Credit Card
            </button>
            <button
              onClick={() => setPaymentMethod("paypal")}
              className={`p-3 flex items-center gap-2 rounded-lg ${
                paymentMethod === "paypal" ? "bg-yellow-500 text-black" : "bg-gray-800 text-white"
              }`}
            >
              <FaPaypal /> PayPal
            </button>
            <button
              onClick={() => setPaymentMethod("crypto")}
              className={`p-3 flex items-center gap-2 rounded-lg ${
                paymentMethod === "crypto" ? "bg-yellow-500 text-black" : "bg-gray-800 text-white"
              }`}
            >
              <FaBitcoin /> Crypto (Coinbase/MetaMask)
            </button>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="mt-6 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePayment}
            className="px-6 py-3 bg-green-500 text-black rounded-lg hover:bg-green-600 transition font-bold flex items-center gap-2"
          >
            <FaCheckCircle /> Place Order
          </motion.button>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
