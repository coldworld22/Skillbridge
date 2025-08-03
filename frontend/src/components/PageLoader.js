import { useEffect, useState } from "react";
import Router from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import useAppConfigStore from "@/store/appConfigStore";
import { API_BASE_URL } from "@/config/config";

// Configure NProgress to remove the spinner icon
NProgress.configure({ showSpinner: false });

const PageLoader = () => {
  const [visible, setVisible] = useState(true);
  const settings = useAppConfigStore((s) => s.settings);
  const loaded = useAppConfigStore((s) => s.loaded);
  const logoSrc = settings.logoUrl || settings.logo_url
    ? `${API_BASE_URL}${settings.logoUrl || settings.logo_url}`
    : null;

  useEffect(() => {
    const handleStart = () => NProgress.start();
    const handleEnd = () => NProgress.done();

    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleEnd);
    Router.events.on("routeChangeError", handleEnd);

    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleEnd);
      Router.events.off("routeChangeError", handleEnd);
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      const t = setTimeout(() => setVisible(false), 1000);
      return () => clearTimeout(t);
    }
  }, [loaded]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-white z-[9999] transition-opacity duration-500 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
        {logoSrc && (
          <img
            src={logoSrc}
            alt="Logo"
            className="absolute w-12 h-12 md:w-16 md:h-16 object-contain"
          />
        )}
      </div>
    </div>
  );
};

export default PageLoader;
