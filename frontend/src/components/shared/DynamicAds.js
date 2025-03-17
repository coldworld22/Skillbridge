import { useState, useEffect } from "react";
import mockAds from "@/mocks/ads.json";

const DynamicAds = () => {
  const [currentAd, setCurrentAd] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % mockAds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border p-4 rounded-lg shadow-md text-center">
      <img src={mockAds[currentAd].image} alt={mockAds[currentAd].title} className="w-full h-40 object-cover rounded" />
      <h2 className="text-lg font-bold mt-2">{mockAds[currentAd].title}</h2>
      <p className="text-gray-600">{mockAds[currentAd].description}</p>
      <a href={mockAds[currentAd].link} className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded">Learn More</a>
    </div>
  );
};

export default DynamicAds;
