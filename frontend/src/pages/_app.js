import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // ✅ Toast notifications
import "react-quill/dist/quill.snow.css";       // ✅ Rich text editor
import "react-phone-input-2/lib/style.css";     // ✅ Phone input styles
import "@/styles/globals.css";    
import "@/services/api/tokenInterceptor";
import useAuthStore from "@/store/auth/authStore";
import useAppConfigStore from "@/store/appConfigStore";
import Head from "next/head";
import "@/styles/globals.css"; // or whatever your path is


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

  const fetchConfig = useAppConfigStore((state) => state.fetch);
  const configLoaded = useAppConfigStore((state) => state.loaded);
  const settings = useAppConfigStore((state) => state.settings);

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

  useEffect(() => {
    if (!configLoaded) fetchConfig();
  }, [configLoaded, fetchConfig]);

  const getPageTitle = () => {
    const slug = router.pathname.split('/').pop();
    if (!slug || slug === 'index') return 'Home';
    if (slug.startsWith('[')) return slug.slice(1, -1);
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const appName = settings.appName || 'SkillBridge';
  const defaultTitle = `${appName} | ${getPageTitle()}`;

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
        <Head>
          <title>{defaultTitle}</title>
          {settings.metaDescription && (
            <meta name="description" content={settings.metaDescription} />
          )}
          {settings.favicon_url && (
            <link
              rel="icon"
              href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://147.93.121.45:5002'}${settings.favicon_url}`}
            />
          )}
        </Head>
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
