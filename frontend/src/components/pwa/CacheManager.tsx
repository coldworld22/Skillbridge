import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { clearCache as clearCacheRequest } from "@/services/admin/cacheService";

// List of URLs to warm up in cache. Replace with actual routes as needed.
const pwaWarmList: string[] = [];

type WarmStatus = "idle" | "caching" | "success" | "error";
type ClearStatus = "idle" | "clearing" | "success" | "error";

interface CacheManagerProps {
  warmList?: string[];
  strategy?: "A" | "B"; // A: fetch URLs, B: postMessage to service worker
}

export default function CacheManager({
  warmList = pwaWarmList,
  strategy = "A",
}: CacheManagerProps) {
  const [warmStatus, setWarmStatus] = useState<WarmStatus>("idle");
  const [clearStatus, setClearStatus] = useState<ClearStatus>("idle");
  const [supportsServiceWorker, setSupportsServiceWorker] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasServiceWorker = "serviceWorker" in navigator;
    setSupportsServiceWorker(hasServiceWorker);

    if (hasServiceWorker) {
      navigator.serviceWorker.ready
        .then(() => setServiceWorkerReady(true))
        .catch(() => setServiceWorkerReady(false));
    }
  }, []);

  const warmCache = async () => {
    if (!supportsServiceWorker) {
      setWarmStatus("error");
      setTimeout(() => setWarmStatus("idle"), 1500);
      return;
    }

    setWarmStatus("caching");
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
      setWarmStatus("success");
    } catch (err) {
      console.error("Failed to warm cache", err);
      setWarmStatus("error");
    } finally {
      setTimeout(() => setWarmStatus("idle"), 1500);
    }
  };

  const clearCache = async () => {
    setClearStatus("clearing");

    if (typeof window !== "undefined") {
      try {
        if ("caches" in window) {
          await caches.delete("SKILLBRIDGE-WARM-V1");
        }

        if (supportsServiceWorker && serviceWorkerReady) {
          const registration = await navigator.serviceWorker.ready;
          registration.active?.postMessage({ type: "CLEAR_WARM_CACHE" });
        }
      } catch (err) {
        console.warn("Failed to clear browser cache", err);
      }
    }

    try {
      await clearCacheRequest();
      setClearStatus("success");
    } catch (err) {
      console.error("Failed to clear server cache", err);
      setClearStatus("error");
    } finally {
      setTimeout(() => setClearStatus("idle"), 2000);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={warmCache} disabled={!supportsServiceWorker || warmStatus === "caching"}>
          {warmStatus === "caching" && "Caching…"}
          {warmStatus === "idle" && "Warm Cache"}
          {warmStatus === "success" && "Cached"}
          {warmStatus === "error" && "Retry"}
        </Button>
        <Button
          className="bg-gray-200 text-gray-800"
          onClick={clearCache}
          type="button"
          disabled={clearStatus === "clearing"}
        >
          {clearStatus === "clearing" ? "Clearing…" : "Clear Cache"}
        </Button>
      </div>
      {!supportsServiceWorker && (
        <p className="text-sm text-gray-500">
          Warming the cache requires an active service worker. Clearing the server cache still works.
        </p>
      )}
      {clearStatus === "error" && (
        <p className="text-sm text-red-600">
          Something went wrong while clearing the cache. Please try again.
        </p>
      )}
    </div>
  );
}
