import { useEffect, useState } from "react";

const GoogleAd = ({ slot }) => {
  const [adConfig, setAdConfig] = useState(null);

  useEffect(() => {
    fetch("/api/adsense")
      .then((res) => res.json())
      .then((data) => setAdConfig(data))
      .catch((err) => console.error("Failed to load AdSense settings:", err));
  }, []);

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
