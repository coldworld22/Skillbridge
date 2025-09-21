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
    const swAvailable = "serviceWorker" in navigator;
    if (isMounted) {
      setHasServiceWorker(swAvailable);
      setReady(true);
    }
    if (swAvailable) {
      navigator.serviceWorker.ready
        .then(() => {
          if (!isMounted) return;
          setServiceWorkerReady(true);
        })
        .catch(() => {
          if (!isMounted) return;
        });
    }
    if (swAvailable && navigator.serviceWorker.controller) {
      if (isMounted) {
        setServiceWorkerReady(true);
      }
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
          throw new Error("Service worker not ready");
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

  const handleClearCache = async () => {
    setClearing(true);
    setMessage(null);
    try {
      const cacheApiAvailable = typeof window !== "undefined" && "caches" in window;
      if (cacheApiAvailable) {
        await caches.delete(WARM_CACHE);
      }
      if (strategy === "B" && serviceWorkerReady) {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({ type: "CLEAR_WARM_CACHE" });
      }
      await clearCache();
      setStatus("idle");
      if (!cacheApiAvailable) {
        setMessage("Server cache cleared. Browser cache unavailable.");
      } else {
        setMessage("Cache cleared");
      }
    } catch (err) {
      console.error(err);
      toast.error(i18n.t("dashboard.cache_clear_failed"));
      setStatus("error");
      setMessage("Failed to clear cache");
    } finally {
      setClearing(false);
    }
  };

  if (!ready) return null;

  const warmDisabled =
    status === "caching" || (strategy === "B" && (!hasServiceWorker || !serviceWorkerReady));

  return (
    <div>
      <div className="space-x-2">
        <Button onClick={warmCache} disabled={warmDisabled}>
          {status === "caching" && "Caching…"}
          {status === "idle" && "Warm Cache"}
          {status === "success" && "Cached"}
          {status === "error" && "Retry"}
        </Button>
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
    </div>
  );
}
