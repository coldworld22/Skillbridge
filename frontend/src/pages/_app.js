import { useEffect, useState } from "react";
import { appWithTranslation, useTranslation } from "next-i18next";
import useSWR from "swr";
import nextI18NextConfig from "../../next-i18next.config.js";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-quill/dist/quill.snow.css";       // ✅ Rich text editor
import "react-phone-input-2/lib/style.css";     // ✅ Phone input styles
import ResizeObserver from "resize-observer-polyfill";
import "@/styles/globals.css";
import "@/services/api/tokenInterceptor";
import useAuthStore from "@/store/auth/authStore";
import useAppConfigStore, {
  useAppConfigHydrated,
} from "@/store/appConfigStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import useCallStore from "@/store/call/callStore";
import CallOverlay from "@/components/video-call/CallOverlay";
import {
  listenCalls,
  listenMessages,
  stopListenMessages,
} from "@/services/messageService";
import useSEOConfigStore from "@/store/seoConfigStore";
import * as authService from "@/services/auth/authService";
import { ensureCsrfToken } from "@/services/api/csrf";
import { getFullProfile } from "@/services/profile/profileService";
import Head from "next/head";
import Script from "next/script";
import { getLanguages } from "@/services/languageService";
import { fetchThirdPartyConfig } from "@/services/thirdPartyService";
import SeoTags from "@/components/common/SeoTags";
import PageLoader from "@/components/PageLoader";
import PopupAnnouncement from "@/components/common/PopupAnnouncement";

if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = ResizeObserver;
}

const langFetcher = () => getLanguages();


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
  const appConfigHydrated = useAppConfigHydrated();
  const startNotifPolling = useNotificationStore((s) => s.startPolling);
  const fetchNotifs = useNotificationStore((s) => s.fetch);
  const startMsgPolling = useMessageStore((s) => s.startPolling);
  const fetchMsgs = useMessageStore((s) => s.fetch);
  const incomingCall = useCallStore((s) => s.incomingCall);
  const outgoingCall = useCallStore((s) => s.outgoingCall);
  const acceptCall = useCallStore((s) => s.acceptCall);
  const declineCall = useCallStore((s) => s.declineCall);
  const cancelCall = useCallStore((s) => s.cancelCall);
  const callAccepted = useCallStore((s) => s.acceptedCall);
  const callDeclined = useCallStore((s) => s.declined);
  const clearCallStatus = useCallStore((s) => s.clearStatus);
  const seoLoaded = useSEOConfigStore((s) => s.loaded);
  const fetchSEO = useSEOConfigStore((s) => s.fetch);
  
  const { i18n } = useTranslation();
  const { data: langs } = useSWR("/languages", langFetcher);
  const { data: thirdPartyConfig } = useSWR(
    "third-party-config",
    fetchThirdPartyConfig
  );
  const currentLang = langs?.find((l) => l.code === i18n.language);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const [gaId, setGaId] = useState(null);

  useEffect(() => {
    if (!hasHydrated || router.pathname.startsWith('/auth')) return;

    const init = async () => {
      try {
        await ensureCsrfToken({ forceRefresh: true });
        const { accessToken } = await authService.refreshAccessToken();
        useAuthStore.setState({ accessToken });
        const res = await getFullProfile();
        useAuthStore.setState({ user: res.data });
      } catch (_) {
        // no active session
      }
    };
    init();
  }, [router.pathname, hasHydrated]);

  useEffect(() => {
    if (!configLoaded) fetchConfig();
  }, [configLoaded, fetchConfig]);

  const gaConfig = thirdPartyConfig?.googleAnalytics;

  useEffect(() => {
    if (!seoLoaded) {
      fetchSEO();
    }
  }, [seoLoaded, fetchSEO]);

  useEffect(() => {
    if (!user) return;

    fetchNotifs();
    startNotifPolling();
    fetchMsgs();
    startMsgPolling();
    listenCalls();
    listenMessages();

    return () => {
      stopListenMessages();
    };
  }, [user, fetchNotifs, startNotifPolling, fetchMsgs, startMsgPolling]);

  useEffect(() => {
    if (callAccepted?.roomId) {
      router.push(`/video-call?roomId=${callAccepted.roomId}`);
      clearCallStatus();
    } else if (callDeclined) {
      toast("Call declined");
      clearCallStatus();
    }
  }, [callAccepted, callDeclined, router, clearCallStatus]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lng");
      const targetLang = router.locale || stored;
      if (targetLang && i18n.language !== targetLang) {
        i18n.changeLanguage(targetLang);
      }
      if (router.locale && router.locale !== stored) {
        localStorage.setItem("lng", router.locale);
      }
    }
  }, [router.locale, i18n]);

  useEffect(() => {
    document.documentElement.dir = currentLang?.direction || 'ltr';
    document.documentElement.classList.toggle(
      'rtl',
      currentLang?.direction === 'rtl'
    );
  }, [currentLang]);

  const getPageTitle = () => {
    const slug = router.pathname.split('/').pop();
    if (!slug || slug === 'index') return 'Home';
    if (slug.startsWith('[')) return slug.slice(1, -1);
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const appName =
    appConfigHydrated && settings.appName
      ? settings.appName
      : 'SkillBridge';
  const defaultTitle = `${appName} | ${getPageTitle()}`;

    return (
      <>
        {gaConfig?.enabled && gaConfig?.measurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaConfig.measurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaConfig.measurementId}');
      `}
            </Script>
          </>
        )}
        <PageLoader />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-inline" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
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
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              {appConfigHydrated && settings.metaDescription && (
                <meta name="description" content={settings.metaDescription} />
              )}
              {appConfigHydrated && settings.favicon_url && (
                <link
                  rel="icon"
                  href={`${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}${settings.favicon_url}`}
                />
              )}
            </Head>
            <SeoTags />
            <PopupAnnouncement />
            {/* Render page with layout */}
            {getLayout(<Component {...pageProps} />)}

            {(incomingCall || outgoingCall) && (
              <CallOverlay
                incoming={!!incomingCall}
                name={incomingCall ? incomingCall.chatId : outgoingCall?.chatId}
                onAccept={incomingCall ? () => acceptCall() : undefined}
                onDecline={incomingCall ? () => declineCall() : cancelCall}
              />
            )}

            {/* Display React Toastify notifications centered at the top */}
            <ToastContainer position="top-center" autoClose={3000} />
          </motion.div>
        </AnimatePresence>
      </>
    );
}

export default appWithTranslation(MyApp, nextI18NextConfig);
