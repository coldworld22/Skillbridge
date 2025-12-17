import { useEffect, useMemo, useRef, useState } from "react";
import { appWithTranslation, useTranslation } from "next-i18next";
import useSWR from "swr";
import nextI18NextConfig from "../../next-i18next.config.js";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-quill/dist/quill.snow.css";       // ✅ Rich text editor
import "react-phone-input-2/lib/style.css";     // ✅ Phone input styles
import "@/styles/globals.scss";    
import "@/services/api/tokenInterceptor";
import useAuthStore from "@/store/auth/authStore";
import useAppConfigStore from "@/store/appConfigStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import useCallStore from "@/store/call/callStore";
import CallOverlay from "@/components/video-call/CallOverlay";
import {
  listenCalls,
  listenMessages,
  stopListenMessages,
  respondToCall,
  endCall,
} from "@/services/messageService";
import useSEOConfigStore from "@/store/seoConfigStore";
import * as authService from "@/services/auth/authService";
import { getFullProfile } from "@/services/profile/profileService";
import Head from "next/head";
import { getLanguages } from "@/services/languageService";
import SeoTags from "@/components/common/SeoTags";
import PageLoader from "@/components/PageLoader";
import PopupAnnouncement from "@/components/common/PopupAnnouncement";
import { API_BASE_URL } from "@/config/config";
import { getCookie } from "@/utils/cookies";
import { SeoConfigContext } from "@/context/SeoConfigContext";
import App from "next/app";
import { resolveApiBase } from "@/utils/serverApi";
import { userHasPermissionForPath } from "@/config/adminRoutePermissions";
import { loadGtagScript, configureGtag } from "@/utils/gtag";
import { initializeGoogleAds } from "@/utils/googleAds";

const langFetcher = () => getLanguages();


           // ✅ Global styles

/**
 * Custom App component for Next.js
 * - Applies framer-motion transitions
 * - Injects per-page layout support
 * - Includes global toast notifications
 */
function MyApp({ Component, pageProps, router }) {
  const { _seoSettings: initialSEOSettings, ...componentPageProps } = pageProps || {};
  const [seoSettings, setSeoSettings] = useState(initialSEOSettings || null);

  // Support for per-page layout pattern
  const getLayout = Component.getLayout || ((page) => page);

  const fetchConfig = useAppConfigStore((state) => state.fetch);
  const configLoaded = useAppConfigStore((state) => state.loaded);
  const settings = useAppConfigStore((state) => state.settings);
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
  const storeSettings = useSEOConfigStore((s) => s.settings);
  
  const { i18n } = useTranslation();
  const { data: langs } = useSWR("/languages", langFetcher);
  const currentLang = langs?.find((l) => l.code === i18n.language);
  const user = useAuthStore((s) => s.user);
  const hasHydratedAuth = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (typeof initialSEOSettings !== "undefined") {
      setSeoSettings(initialSEOSettings || null);
    }
  }, [initialSEOSettings]);

  useEffect(() => {
    if (!seoSettings) return;
    // Hydrate the SEO store on the client so admin pages keep working.
    useSEOConfigStore.setState((state) => ({
      settings: { ...state.settings, ...seoSettings },
      loaded: true,
    }));
  }, [seoSettings]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem("auth");
    if (!raw) {
      useAuthStore.setState({ hasHydrated: true });
      return;
    }

    try {
      const stored = JSON.parse(raw);
      const parsed = stored?.state ?? stored;

      if (parsed?.user) {
        useAuthStore.setState({
          user: parsed.user,
          accessToken: parsed.accessToken,
          onboarding:
            parsed.onboarding ||
            {
              profile_complete: parsed.user.profile_complete,
              is_email_verified: parsed.user.is_email_verified,
              complete:
                Boolean(parsed.user.profile_complete) &&
                Boolean(parsed.user.is_email_verified),
            },
          hasHydrated: true, // ✅ manually set hydration flag
        });
        return;
      }
    } catch (err) {
      console.warn("Failed to parse persisted auth state; clearing local copy.", err);
      localStorage.removeItem("auth");
    }

    useAuthStore.setState({ hasHydrated: true });
  }, []);

  useEffect(() => {
    if (router.pathname.startsWith('/auth')) return;

    const init = async () => {
      try {
        // Avoid calling refresh endpoint if no refresh cookie exists
        const hasRefresh = !!getCookie('refreshToken');
        if (!hasRefresh) return;

        const { accessToken } = await authService.refreshAccessToken();
        useAuthStore.setState({ accessToken });
        const res = await getFullProfile();
        useAuthStore.setState({ user: res.data });
      } catch (_) {
        // no active session
      }
    };
    init();
  }, [router.pathname]);

  useEffect(() => {
    if (!configLoaded) fetchConfig();
  }, [configLoaded, fetchConfig]);

  useEffect(() => {
    let isMounted = true;

    const fetchAnalyticsConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/google-analytics`);
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        const json = await res.json();
        if (!isMounted) return;
        const cfg = json?.data || {};
        const measurementId = cfg.measurementId;
        const enabled = cfg.enabled !== false && cfg.active !== false;
        if (enabled && measurementId) {
          loadGtagScript(measurementId, "data-ga-measurement-id");
          configureGtag(measurementId);
        }
      } catch (err) {
        console.error("Failed to load Google Analytics", err);
      }
    };

    fetchAnalyticsConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchGoogleAdsConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/google-ads`);
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        const json = await res.json();
        if (!isMounted) return;
        const cfg = json?.data || {};
        if (cfg && (cfg.conversionId || (cfg.conversions || []).length)) {
          initializeGoogleAds(cfg);
        }
      } catch (err) {
        console.error("Failed to load Google Ads config", err);
      }
    };

    fetchGoogleAdsConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!seoLoaded && !seoSettings) {
      fetchSEO();
    }
  }, [seoLoaded, seoSettings, fetchSEO]);

  useEffect(() => {
    if (!user || !user.profile_complete || !user.is_email_verified) return;

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

  const handleIncomingAccept = async () => {
    const call = incomingCall;
    if (!call) return;
    try {
      if (call.callId) {
        await respondToCall(call.callId, "accept");
      }
    } catch (err) {
      console.error("Failed to acknowledge accepted call", err);
    }
    acceptCall();
  };

  const handleIncomingDecline = async () => {
    const call = incomingCall;
    if (!call) return;
    try {
      if (call.callId) {
        await respondToCall(call.callId, "decline");
      }
    } catch (err) {
      console.error("Failed to acknowledge declined call", err);
    }
    declineCall();
  };

  const handleOutgoingCancel = async () => {
    const call = outgoingCall;
    if (call?.callId) {
      try {
        await endCall(call.callId);
      } catch (err) {
        console.error("Failed to end call", err);
      }
    }
    cancelCall();
  };

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

  const lastDeniedPathRef = useRef(null);

  useEffect(() => {
    if (!hasHydratedAuth) return;
    if (!user) return;
    const currentPath = router.asPath || "/";
    if (!currentPath.startsWith("/dashboard/admin")) return;
    if (currentPath.startsWith("/error/403")) return;

    if (userHasPermissionForPath(user, currentPath)) {
      lastDeniedPathRef.current = null;
      return;
    }

    if (lastDeniedPathRef.current === currentPath) return;
    lastDeniedPathRef.current = currentPath;
    toast.error("You do not have permission to access this page.");
    router.replace("/error/403");
  }, [router.asPath, user, hasHydratedAuth, router]);

  const getPageTitle = () => {
    const slug = router.pathname.split('/').pop();
    if (!slug || slug === 'index') return 'Home';
    if (slug.startsWith('[')) return slug.slice(1, -1);
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const appName = settings.appName || 'SkillBridge';
  const defaultTitle = `${appName} | ${getPageTitle()}`;

  const contextValue = useMemo(
    () => ({
      settings: seoLoaded ? storeSettings : seoSettings,
      setSettings: setSeoSettings,
    }),
    [seoLoaded, storeSettings, seoSettings]
  );

  return (
    <SeoConfigContext.Provider value={contextValue}>
      <PageLoader />
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
            {/* Default favicon to avoid 404s before settings load */}
            <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            <link rel="alternate icon" href="/favicon.ico" />
            <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
            {settings.metaDescription && (
              <meta name="description" content={settings.metaDescription} />
            )}
            {settings.favicon_url && (
              <link
                rel="icon"
                href={`${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}${settings.favicon_url}`}
              />
            )}
          </Head>
          <SeoTags />
          <PopupAnnouncement />
          {/* Render page with layout */}
          {getLayout(<Component {...componentPageProps} />)}

          {(incomingCall || outgoingCall) && (
            <CallOverlay
              incoming={!!incomingCall}
              name={
                incomingCall?.name ||
                outgoingCall?.name ||
                incomingCall?.chatId ||
                outgoingCall?.chatId
              }
              onAccept={incomingCall ? handleIncomingAccept : undefined}
              onDecline={incomingCall ? handleIncomingDecline : handleOutgoingCancel}
            />
          )}

          {/* Global Toast Message Containers */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#333",
                color: "#fff",
              },
            }}
          />
          {/* Display React Toastify notifications centered at the top */}
          <ToastContainer position="top-center" autoClose={3000} />
        </motion.div>
      </AnimatePresence>
    </SeoConfigContext.Provider>
  );
}

MyApp.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext);

  let seoSettings = null;
  const base = resolveApiBase(typeof window !== "undefined");
  if (base) {
    try {
      const url = `${base.replace(/\/$/, "")}/seo-config`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const json = await res.json();
        seoSettings = json?.data ?? json ?? null;
      }
    } catch (err) {
      console.warn("Failed to preload SEO settings", err);
    }
  }

  const ctx = appContext.ctx;
  if (ctx?.res && seoSettings?.redirects?.length) {
    const normalize = (value) => {
      if (!value) return "/";
      const prefixed = value.startsWith("/") ? value : `/${value}`;
      if (prefixed === "/") return "/";
      return prefixed.replace(/\/+$/, "") || "/";
    };

    const requestPath = normalize(ctx.asPath?.split("?")[0] || ctx.pathname || "/");
    const redirectRule = seoSettings.redirects.find((rule) => {
      if (!rule?.from || !rule?.to) return false;
      const from = normalize(rule.from);
      return from === requestPath;
    });

    if (
      redirectRule &&
      normalize(redirectRule.to) !== requestPath &&
      !ctx.res.headersSent
    ) {
      const statusCode = Number(redirectRule.code) || 302;
      ctx.res.writeHead(statusCode, { Location: redirectRule.to });
      ctx.res.end();
    }
  }

  return {
    ...appProps,
    pageProps: {
      ...appProps.pageProps,
      _seoSettings: seoSettings,
    },
  };
};

export default appWithTranslation(MyApp, nextI18NextConfig);
