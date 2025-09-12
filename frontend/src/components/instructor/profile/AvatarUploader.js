import { FaUserCircle, FaTrash, FaUpload, FaSpinner } from "react-icons/fa";

export default function AvatarUploader({ avatarPreview, isSubmitting, t, onSelect, onRemove }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaUserCircle className="text-yellow-600" /> {t('profile_picture')}
      </h2>
      <div className="flex flex-col items-center">
        {avatarPreview ? (
          <div className="relative mb-4">
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover border-2 border-yellow-200"
            />
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              <FaTrash size={14} />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
            <FaUserCircle size={48} className="text-gray-400" />
          </div>
        )}
        <label className="cursor-pointer">
          <input type="file" accept="image/*" onChange={onSelect} className="hidden" />
          <div className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2">
            {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaUpload />}
            {avatarPreview ? t('change_photo') : t('upload_photo')}
          </div>
        </label>
      </div>
    </div>
  );
}
