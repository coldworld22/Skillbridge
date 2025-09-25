import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { CACHE_VERSION } from "@/config/pwa";
import { clearCache } from "@/services/admin/cacheService";
import { toast } from "react-toastify";
import { i18n } from "next-i18next";

// List of URLs to warm up in cache. Replace with actual routes as needed.
const pwaWarmList = [];
const WARM_CACHE = `SKILLBRIDGE-WARM-${CACHE_VERSION}`;

/**
 * @typedef {"idle" | "caching" | "success" | "error"} Status
 */

/**
 * @param {Object} [props]
 * @param {string[]} [props.warmList]
 * @param {"A"|"B"} [props.strategy]
 */
export default function CacheManager({
  warmList = pwaWarmList,
  strategy = "A",
} = {}) {
  const [status, setStatus] = useState("idle");
  const [ready, setReady] = useState(false);
  const [hasServiceWorker, setHasServiceWorker] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [message, setMessage] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return () => {};
    let isMounted = true;
    if ("serviceWorker" in navigator) {
      setHasServiceWorker(true);
      navigator.serviceWorker.ready
        .then(() => {
          if (!isMounted) return;
          setServiceWorkerReady(true);
        })
        .catch((err) => {
          console.error("Service worker readiness check failed", err);
        });
      if (isMounted) setReady(true);
    } else {
      setHasServiceWorker(false);
      setReady(true);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const warmCache = async () => {
    setStatus("caching");
    setMessage(null);
    try {
      if (strategy === "A") {
        await Promise.all(warmList.map((url) => fetch(url)));
      } else {
        if (!serviceWorkerReady) {
          setStatus("error");
          setMessage("Service worker not ready");
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: "WARM_UP_CACHE",
          payload: warmList,
        });
      }
      setStatus("success");
      setMessage("Cache warmed");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Failed to warm cache");
    }
  };

  const translate = (key, fallback) => {
    if (typeof i18n?.t === "function") {
      const translated = i18n.t(key);
      if (translated && translated !== key) {
        return translated;
      }
    }
    return fallback;
  };

  const handleClearCache = async () => {
    setClearing(true);
    setMessage(null);
    try {
      const browserCacheSupported = "caches" in window;
      if (browserCacheSupported) {
        try {
          await caches.delete(WARM_CACHE);
        } catch (cacheError) {
          console.warn("Failed to clear warm cache bucket", cacheError);
        }
      }
      if (strategy === "B" && serviceWorkerReady) {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({ type: "CLEAR_WARM_CACHE" });
      }
      await clearCache();
      setStatus("idle");
      const successMessage = translate("dashboard.cache_cleared", "Cache cleared");
      const fallbackMessage = "Browser cache unavailable; server cache cleared";
      const finalMessage = browserCacheSupported ? successMessage : fallbackMessage;
      setMessage(finalMessage);
      const toastFn = browserCacheSupported ? toast.success : toast.info;
      toastFn(finalMessage);
    } catch (err) {
      console.error(err);
      const errorMessage = translate(
        "dashboard.cache_clear_failed",
        "Failed to clear cache"
      );
      toast.error(errorMessage);
      setStatus("error");
      setMessage(errorMessage);
    } finally {
      setClearing(false);
    }
  };

  if (!ready) return null;

  const showWarmCacheButton = strategy === "A" || hasServiceWorker;
  const warmCacheDisabled =
    status === "caching" || (strategy === "B" && !serviceWorkerReady);

  return (
    <div>
      <div className="space-x-2">
        {showWarmCacheButton && (
          <Button onClick={warmCache} disabled={warmCacheDisabled}>
            {status === "caching" && "Caching…"}
            {status === "idle" && "Warm Cache"}
            {status === "success" && "Cached"}
            {status === "error" && "Retry"}
          </Button>
        )}
        <Button
          className="bg-gray-200 text-gray-800"
          onClick={handleClearCache}
          type="button"
          disabled={clearing}
        >
          {clearing ? "Clearing…" : "Clear Cache"}
        </Button>
      </div>
      {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}
      {!serviceWorkerReady && strategy === "B" && hasServiceWorker && (
        <p className="text-sm text-gray-600 mt-2">
          Service worker is still starting up. The warm cache action will be
          enabled once it is ready.
        </p>
      )}
      {!hasServiceWorker && strategy === "B" && (
        <p className="text-sm text-gray-600 mt-2">
          No service worker detected. Warming the cache requires a service
          worker, but you can still clear the server cache below.
        </p>
      )}
    </div>
  );
}
