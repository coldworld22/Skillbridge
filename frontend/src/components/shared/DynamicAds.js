import { useState, useEffect } from "react";
import { fetchAds } from "@/services/adsService";

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

  if (loading) return <div className="text-center">Loading ads...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!ads.length) return null;

  const ad = ads[currentAd];
  return (
    <div className="border p-4 rounded-lg shadow-md text-center">
      {ad.image && (
        <img
          src={ad.image}
          alt={ad.title}
          className="w-full h-40 object-cover rounded"
        />
      )}
      <h2 className="text-lg font-bold mt-2">{ad.title}</h2>
      {ad.description && (
        <p className="text-gray-600">{ad.description}</p>
      )}
      {ad.link && (
        <a
          href={ad.link}
          className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded"
        >
          Learn More
        </a>
      )}
    </div>
  );
};

export default DynamicAds;
