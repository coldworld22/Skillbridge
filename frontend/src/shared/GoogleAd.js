import { useEffect, useState } from "react";
import api from "@/services/api/api";

const GoogleAd = ({ slot }) => {
  const [adConfig, setAdConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get("/adsense");
        setAdConfig(data);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to load AdSense settings:", err);
        }
        setAdConfig(null);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (adConfig && adConfig.enabled) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.error("AdSense error:", e);
        }
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
