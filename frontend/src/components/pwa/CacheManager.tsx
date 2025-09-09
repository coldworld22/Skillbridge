import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { CACHE_VERSION } from "@/config/pwa";
import { clearCache as clearServerCache } from "@/services/admin/cacheService";
import { toast } from "react-toastify";
import { i18n } from "next-i18next";

// List of URLs to warm up in cache. Replace with actual routes as needed.
const pwaWarmList: string[] = [];
const WARM_CACHE = `SKILLBRIDGE-WARM-${CACHE_VERSION}`;

type Status = "idle" | "caching" | "success" | "error";

interface CacheManagerProps {
  warmList?: string[];
  strategy?: "A" | "B"; // A: fetch URLs, B: postMessage to service worker
}

export default function CacheManager({
  warmList = pwaWarmList,
  strategy = "A",
}: CacheManagerProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => setReady(true));
    }
  }, []);

  const warmCache = async () => {
    setStatus("caching");
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
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const clearCache = async () => {
    try {
      await caches.delete(WARM_CACHE);
      if (strategy === "B") {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({ type: "CLEAR_WARM_CACHE" });
      }
      await clearServerCache();
      toast.success(i18n.t("dashboard.cache_cleared"));
      setStatus("idle");
    } catch (err) {
      console.error(err);
      toast.error(i18n.t("dashboard.cache_clear_failed"));
      setStatus("error");
    }
  };

  if (!ready) return null;

  return (
    <div className="space-x-2">
      <Button onClick={warmCache} disabled={status === "caching"}>
        {status === "caching" && "Caching…"}
        {status === "idle" && "Warm Cache"}
        {status === "success" && "Cached"}
        {status === "error" && "Retry"}
      </Button>
      <Button className="bg-gray-200 text-gray-800" onClick={clearCache} type="button">
        Clear Cache
      </Button>
    </div>
  );
}

