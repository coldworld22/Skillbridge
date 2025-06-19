import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // ✅ Toast notifications
import "react-quill/dist/quill.snow.css";       // ✅ Rich text editor
import "react-phone-input-2/lib/style.css";     // ✅ Phone input styles
import "@/styles/globals.css";    
import "@/services/api/tokenInterceptor";
import useAuthStore from "@/store/auth/authStore";

           // ✅ Global styles

/**
 * Custom App component for Next.js
 * - Applies framer-motion transitions
 * - Injects per-page layout support
 * - Includes global toast notifications
 */
function MyApp({ Component, pageProps, router }) {
  // Support for per-page layout pattern
  const getLayout = Component.getLayout || ((page) => page);

    useEffect(() => {
    const local = localStorage.getItem("auth");
    if (local) {
      const parsed = JSON.parse(local)?.state;
      if (parsed?.user) {
        useAuthStore.setState({
          user: parsed.user,
          accessToken: parsed.accessToken,
          hasHydrated: true, // ✅ manually set hydration flag
        });
      }
    }
  }, []);

  return (
    <AnimatePresence mode="wait">
      {/* Motion wrapper for route transition */}
      <motion.div
        key={router.route}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        {/* Render page with layout */}
        {getLayout(<Component {...pageProps} />)}

        {/* Global Toast Message Container */}
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </motion.div>
    </AnimatePresence>
  );
}

export default MyApp;
