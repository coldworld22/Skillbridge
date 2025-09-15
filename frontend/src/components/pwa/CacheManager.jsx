import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { CACHE_VERSION } from "@/config/pwa";
import { clearCache } from "@/services/admin/cacheService";
import { toast } from "react-toastify";
import { i18n } from "next-i18next";

// List of URLs to warm up in cache. Replace with actual routes as needed.
const pwaWarmList = [];
const WARM_CACHE = `SKILLBRIDGE-WARM-${CACHE_VERSION}`;

export default function CacheManager({
  warmList = pwaWarmList,
  strategy = "A",
} = {}) {
  const [status, setStatus] = useState("idle");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return () => {};
    let isMounted = true;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => {
        if (isMounted) setReady(true);
      });
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
      if ("caches" in window) {
        await caches.delete(WARM_CACHE);
      } else {
        setStatus("error");
        return;
      }
      if (strategy === "B") {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({ type: "CLEAR_WARM_CACHE" });
      }
      await clearCache();
      setStatus("idle");
      setMessage("Cache cleared");
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

  return (
    <div>
      <div className="space-x-2">
        <Button onClick={warmCache} disabled={status === "caching"}>
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
