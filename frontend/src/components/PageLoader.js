import { useEffect, useState } from "react";
import Router from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import useAppConfigStore from "@/store/appConfigStore";
import { API_BASE_URL } from "@/config/config";
import styles from "./PageLoader.module.scss";

// Configure NProgress to remove the spinner icon
NProgress.configure({ showSpinner: false });

const PageLoader = () => {
  const [visible, setVisible] = useState(false);
  const settings = useAppConfigStore((s) => s.settings);
  const logoSrc = settings.logoUrl || settings.logo_url
    ? `${API_BASE_URL}${settings.logoUrl || settings.logo_url}`
    : null;

  useEffect(() => {
    const handleStart = () => {
      setVisible(true);
      NProgress.start();
    };
    const handleEnd = () => {
      NProgress.done();
      setVisible(false);
    };

    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleEnd);
    Router.events.on("routeChangeError", handleEnd);

    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleEnd);
      Router.events.off("routeChangeError", handleEnd);
    };
  }, []);

  return (
    <div className={`${styles.overlay} ${visible ? styles.visible : ""}`}>
      <div className={styles.loader}>
        <div className={styles.spinner}></div>
        {logoSrc && (
          <img
            src={logoSrc}
            alt="Logo"
            className={styles.logo}
          />
        )}
      </div>
    </div>
  );
};

export default PageLoader;
