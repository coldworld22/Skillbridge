// components/admin/ads/AdCard.js
import { FaEye, FaEdit, FaTrashAlt, FaChartBar } from "react-icons/fa";

export default function AdCard({
  ad,
  toggleAdStatus,
  handleEdit,
  handleDelete,
  handlePreview,
  handleAnalytics,
  isSelected,
  toggleSelect
}) {
  return (
    <div className={`relative bg-white rounded-lg shadow border transition ${isSelected ? "ring-2 ring-blue-500" : ""}`}>
      {/* Select Checkbox */}
      <div className="absolute top-3 left-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelect(ad.id)}
          aria-label={`Select ${ad.title}`}
          className="w-4 h-4"
        />
      </div>

      {/* Ad Image */}
      <img
        src={ad.image}
        alt={ad.title}
        className="w-full h-40 object-cover rounded-t-lg"
      />

      {/* Ad Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{ad.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${ad.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
            {ad.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{ad.description}</p>
        <div className="flex flex-wrap gap-1 text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-0.5 rounded">{ad.adType}</span>
          {ad.targetRoles?.map((role) => (
            <span
              key={role}
              className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded capitalize"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center border-t px-4 py-2 bg-gray-50 rounded-b-lg">
        <div className="flex gap-2 text-gray-600 text-sm">
          <button onClick={() => handlePreview(ad)} aria-label="Preview Ad">
            <FaEye className="hover:text-blue-600" />
          </button>
          <button onClick={() => handleEdit(ad)} aria-label="Edit Ad">
            <FaEdit className="hover:text-yellow-600" />
          </button>
          <button onClick={() => handleDelete(ad)} aria-label="Delete Ad">
            <FaTrashAlt className="hover:text-red-600" />
          </button>
          <button onClick={() => handleAnalytics(ad)} aria-label="View Analytics">
            <FaChartBar className="hover:text-purple-600" />
          </button>
        </div>
        <label className="flex items-center gap-1 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={ad.isActive}
            onChange={() => toggleAdStatus(ad.id)}
            className="w-3 h-3"
          />
          <span>{ad.isActive ? "On" : "Off"}</span>
        </label>
      </div>
    </div>
  );
}
