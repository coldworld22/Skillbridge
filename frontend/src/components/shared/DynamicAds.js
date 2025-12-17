import { useState, useEffect } from "react";
import { fetchAds } from "@/services/adsService";
import styles from "./DynamicAds.module.scss";

const DynamicAds = () => {
  const [ads, setAds] = useState([]);
  const [currentAd, setCurrentAd] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadAds = async () => {
      try {
        const { data } = await fetchAds();
        if (isMounted) setAds(data);
      } catch (err) {
        if (isMounted) setError("Failed to load ads");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadAds();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ads.length) return;
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads]);

  if (loading) return <div className={styles.loading}>Loading ads...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!ads.length) return null;

  const ad = ads[currentAd];
  return (
    <div className={styles.card}>
      {ad.image && (
        <img
          src={ad.image}
          alt={ad.title}
          className={styles.image}
        />
      )}
      <h2 className={styles.title}>{ad.title}</h2>
      {ad.description && (
        <p className={styles.description}>{ad.description}</p>
      )}
      {ad.link && (
        <a
          href={ad.link}
          className={styles.cta}
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn More
        </a>
      )}
    </div>
  );
};

export default DynamicAds;
