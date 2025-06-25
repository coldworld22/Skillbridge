import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import { getCartItems } from "@/services/cartService"; // ✅ Import mock API
import { motion, AnimatePresence } from "framer-motion"; // ✅ Import animations
import { FaTrash, FaPlus, FaMinus, FaTag, FaGift } from "react-icons/fa";
import Link from "next/link";
import { toast } from "react-toastify";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState(""); // ✅ State for Discount Code
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const validDiscounts = { SAVE10: 10, "قسيمة10": 10, "DISCOUNT20": 20 }; // ✅ Support Arabic Discount Code

  useEffect(() => {
    getCartItems().then((data) => {
      setCartItems(data);
      setLoading(false);
    });
  }, []);

  // Update quantity
  const updateQuantity = (id, type) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? { ...item, quantity: type === "increase" ? item.quantity + 1 : Math.max(1, item.quantity - 1) }
          : item
      )
    );
    toast.success("Cart updated");
  };

  // Remove item
  const removeItem = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    toast.info("Item removed");
  };

  // Apply Discount Code
  const applyDiscount = () => {
    if (validDiscounts[discountCode]) {
      setDiscountAmount(validDiscounts[discountCode]);
      setDiscountApplied(true);
      toast.success("Discount applied");
    } else {
      setDiscountAmount(0);
      setDiscountApplied(false);
      if (discountCode) toast.error("Invalid code");
    }
  };

  // Calculate total price
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalPrice = Math.max(0, subtotal - discountAmount);

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <main className="pt-24 pb-12 container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-4 text-center">🛒 Your Shopping Cart</h1>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-lg">Loading your cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-10">
            <FaGift className="mx-auto text-6xl mb-4 text-yellow-500" />
            <p className="text-lg">Your cart is empty.</p>
            <Link href="/marketplace">
              <button className="mt-4 px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition">
                Browse Courses
              </button>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-900 shadow-md rounded-lg p-6"
          >
            {/* Cart Items with Animation */}
            <ul className="space-y-6">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-between items-center border-b border-gray-700 pb-4"
                  >
                    <div className="flex items-center space-x-4">
                      <FaGift className="text-yellow-500 text-4xl" />
                      <div>
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        <p className="text-gray-400">${item.price} per item</p>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(item.id, "decrease")}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full"
                      >
                        <FaMinus />
                      </motion.button>
                      <span className="text-lg font-bold">{item.quantity}</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(item.id, "increase")}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full"
                      >
                        <FaPlus />
                      </motion.button>
                    </div>

                    {/* Remove Button */}
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-500 hover:text-red-600"
                    >
                      <FaTrash />
                    </motion.button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            {/* Discount Code Section */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-bold flex items-center">
                <FaTag className="mr-2 text-yellow-500" /> Apply Discount Code (قسيمة الخصم)
              </h3>
              <div className="flex mt-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Enter code (e.g., SAVE10, قسيمة10)"
                  className="w-full p-2 border rounded-l-lg focus:outline-none"
                />
                <button onClick={applyDiscount} className="px-6 bg-yellow-500 text-black rounded-r-lg hover:bg-yellow-600 transition">
                  Apply
                </button>
              </div>
              {discountApplied ? (
                <p className="text-green-500 mt-2">✅ Discount applied! -${discountAmount}</p>
              ) : discountCode ? (
                <p className="text-red-500 mt-2">❌ Invalid code</p>
              ) : null}
            </div>

            {/* Summary & Checkout */}
            <div className="mt-6 bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-lg font-bold">Subtotal:</span>
                <span className="text-lg">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span className="text-lg font-bold">Discount:</span>
                <span className="text-lg">-${discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-2 border-t border-gray-700 pt-2">
                <span className="text-xl font-bold">Total:</span>
                <span className="text-xl text-yellow-500">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="mt-6 flex justify-end">
              <Link href="/payments/checkout">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="px-6 py-3 bg-green-500 text-black rounded-lg hover:bg-green-600 transition font-bold"
                >
                  Proceed to Checkout
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CartPage;
