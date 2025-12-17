import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import useCartStore from "@/store/cart/cartStore";
import useAuthStore from "@/store/auth/authStore";
import { motion, AnimatePresence } from "framer-motion"; // ✅ Import animations
import { FaTag, FaGift } from "react-icons/fa";
import { toast } from "react-toastify";
import CartItem from "@/components/books/CartItem";
import Link from "next/link";
import styles from "./cart.module.scss";

const CartPage = () => {
  const {
    items: cartItems,
    isLoading,
    fetchCart,
    updateItem: updateCartItemAction,
    removeItem: removeCartItemAction,
  } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const loading = isLoading;
  const [discountCode, setDiscountCode] = useState(""); // ✅ State for Discount Code
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const validDiscounts = { SAVE10: 10, "قسيمة10": 10, "DISCOUNT20": 20 }; // ✅ Support Arabic Discount Code

  useEffect(() => {
    if (user) fetchCart();
  }, [user, fetchCart]);

  // Update quantity
  const updateQuantity = (id, type) => {
    const item = cartItems.find((c) => c.id === id);
    if (!item) return;
    const qty = type === "increase" ? item.quantity + 1 : Math.max(1, item.quantity - 1);
    updateCartItemAction(id, qty);
    toast.success("Cart updated");
  };

  // Remove item
  const removeItem = (id) => {
    removeCartItemAction(id);
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
  // Checkout supports a single item at a time. Use the first item by default.
  const firstItem = cartItems[0] || null;
  const checkoutHref = firstItem
    ? `/payments/checkout?itemId=${encodeURIComponent(firstItem.id)}&itemType=${encodeURIComponent(firstItem.item_type || 'book')}`
    : null;

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.heading}>🛒 Your Shopping Cart</h1>

        {loading ? (
          <div className={styles.state}>
            <p className={styles.stateText}>Loading your cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className={styles.state}>
            <FaGift className={styles.stateIcon} />
            <p className={styles.stateText}>Your cart is empty.</p>
            <Link href="/website">
              <button className={styles.stateButton}>
                Browse Courses
              </button>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={styles.panel}
          >
            {/* Cart Items with Animation */}
            <ul className={styles.list}>
              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    index={index}
                    onIncrease={() => updateQuantity(item.id, "increase")}
                    onDecrease={() => updateQuantity(item.id, "decrease")}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </AnimatePresence>
            </ul>

            {/* Discount Code Section */}
            <div className={styles.discountCard}>
              <h3 className={styles.discountTitle}>
                <FaTag className={styles.discountTitleIcon} /> Apply Discount Code (قسيمة الخصم)
              </h3>
              <div className={styles.discountRow}>
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Enter code (e.g., SAVE10, قسيمة10)"
                  className={styles.discountInput}
                />
                <button onClick={applyDiscount} className={styles.applyBtn}>
                  Apply
                </button>
              </div>
              {discountApplied ? (
                <p className={styles.discountFeedbackSuccess}>✅ Discount applied! -${discountAmount}</p>
              ) : discountCode ? (
                <p className={styles.discountFeedbackError}>❌ Invalid code</p>
              ) : null}
            </div>

            {/* Summary & Checkout */}
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Discount:</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryDivider}`}>
                <span>Total:</span>
                <span className={styles.summaryAccent}>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <div className={styles.actions}>
              {cartItems.length > 0 && checkoutHref && (
                <Link href={checkoutHref}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={styles.checkoutBtn}
                  >
                    Proceed to Checkout
                  </motion.button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CartPage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
