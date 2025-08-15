import { useEffect, useState } from "react";

const GoogleAd = ({ slot }) => {
  const [adConfig, setAdConfig] = useState(null);

  useEffect(() => {
    fetch("/api/adsense")
      .then((res) => {
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          setAdConfig(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setAdConfig(data);
      })
      .catch(() => {
        setAdConfig(null);
      });
  }, []);

  useEffect(() => {
    if (adConfig && adConfig.enabled) {
      if (!document.querySelector('script[data-adsbygoogle]')) {
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.async = true;
        script.dataset.adsbygoogle = 'true';
        script.crossOrigin = 'anonymous';
        document.body.appendChild(script);
      }
    }
  }, [adConfig]);

  useEffect(() => {
    if (adConfig && adConfig.enabled) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, [adConfig]);

  if (!adConfig || !adConfig.enabled) return null; // Hide ads if disabled

  return (
    <div className="flex justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adConfig.clientID}
        data-ad-slot={slot || adConfig.slotID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default GoogleAd;
