// components/admin/PreviewModal.js
import { FaChartBar } from 'react-icons/fa';
import Link from 'next/link';

const PreviewModalinstrutor = ({ ad, onClose }) => {
  if (!ad) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white max-w-md w-full rounded-lg shadow-lg p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black">
          ✕
        </button>
        <img src={ad.image} alt={ad.title} className="w-full h-48 object-cover rounded mb-4" />
        <h2 className="text-xl font-bold mb-2">{ad.title}</h2>
        <p className="text-sm text-gray-700 mb-2">{ad.description}</p>
        <p className="text-xs text-gray-500 mb-1">🎯 Target: {ad.targetRoles.join(', ')}</p>
        <p className="text-xs text-gray-500 mb-1">📅 {ad.startAt} → {ad.endAt}</p>
        <p className="text-xs text-blue-500">👁️ {ad.views} views</p>
        <p className="text-xs text-purple-500">📌 Type: {ad.adType}</p>
        <Link href={`/dashboard/instructor/ads/analytics/${ad.id}`}>
          <button className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 text-sm">
            <FaChartBar /> View Analytics
          </button>
        </Link>
      </div>
    </div>
  );  
};

export default PreviewModalinstrutor;
