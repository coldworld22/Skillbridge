import { useEffect, useMemo, useState } from "react";

const ADSENSE_SCRIPT_ATTR = "data-adsense-loader";

const normalizeConfig = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  const publisherId = payload.publisherId?.trim();
  if (!publisherId) return null;
  const slots = Array.isArray(payload.adSlots)
    ? payload.adSlots.map((slot) => slot?.toString().trim()).filter(Boolean)
    : [];
  return {
    publisherId,
    adSlots: slots,
    autoAds: payload.autoAds === "disabled" ? "disabled" : "enabled",
  };
};

const loadAdsenseScript = (publisherId) => {
  if (typeof window === "undefined" || !publisherId) return;
  const selector = `script[${ADSENSE_SCRIPT_ATTR}="true"][data-client="${publisherId}"]`;
  if (document.querySelector(selector)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  script.crossOrigin = "anonymous";
  script.dataset.adsenseLoader = "true";
  script.dataset.client = publisherId;
  document.head.appendChild(script);
};

const GoogleAd = ({ slot, className = "", style }) => {
  const [config, setConfig] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/adsense");
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        const normalized = normalizeConfig(json?.data);
        setConfig(normalized);
      } catch (err) {
        console.error("Failed to load AdSense settings:", err);
        if (mounted) setConfig(null);
      } finally {
        if (mounted) setLoaded(true);
      }
    };
    fetchConfig();
    return () => {
      mounted = false;
    };
  }, []);

  const resolvedSlot = useMemo(() => {
    if (slot) return slot;
    return config?.adSlots?.[0] || null;
  }, [slot, config?.adSlots]);

  useEffect(() => {
    if (!config?.publisherId) return;
    loadAdsenseScript(config.publisherId);
  }, [config?.publisherId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!config?.publisherId || !resolvedSlot) return;
    if (!loaded) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({
        google_ad_client: config.publisherId,
        enable_page_level_ads: config.autoAds === "enabled",
      });
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [config?.publisherId, resolvedSlot, loaded, config?.autoAds]);

  if (!config?.publisherId) return null;
  if (!resolvedSlot && config.autoAds === "enabled") {
    // Auto ads placements do not require dedicated slots.
    return null;
  }
  if (!resolvedSlot) return null;

  return (
    <div className={`flex justify-center ${className}`.trim()}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...(style || {}) }}
        data-ad-client={config.publisherId}
        data-ad-slot={resolvedSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default GoogleAd;
