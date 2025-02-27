import { useEffect, useState } from "react";

const DynamicAds = () => {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetch("/api/ads")
      .then((res) => res.json())
      .then((data) => setAds(data))
      .catch((err) => console.error("Failed to load ads:", err));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {ads.map((ad, index) => (
        <a key={index} href={ad.link} target="_blank" rel="noopener noreferrer" className="block">
          <img src={ad.image} alt={ad.title} className="w-full h-auto rounded-lg shadow-md" />
        </a>
      ))}
    </div>
  );
};

export default DynamicAds;
