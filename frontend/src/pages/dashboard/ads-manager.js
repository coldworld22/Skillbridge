import { useState } from "react";
import mockAds from "@/mocks/ads.json";

const AdsManager = () => {
  const [ads, setAds] = useState(mockAds);

  const handleDelete = (id) => {
    setAds(ads.filter((ad) => ad.id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Manage Ads</h1>
      <button className="bg-blue-500 text-white px-4 py-2 rounded mb-4">+ Add New Ad</button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.map((ad) => (
          <div key={ad.id} className="border p-4 rounded-lg shadow-md">
            <img src={ad.image} alt={ad.title} className="w-full h-40 object-cover rounded" />
            <h2 className="text-xl font-bold mt-2">{ad.title}</h2>
            <p className="text-gray-600">{ad.description}</p>
            <div className="flex justify-between mt-4">
              <button className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
              <button onClick={() => handleDelete(ad.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdsManager;
