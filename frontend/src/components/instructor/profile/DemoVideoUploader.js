import { FaVideo, FaTrash, FaUpload, FaSpinner } from "react-icons/fa";

export default function DemoVideoUploader({
  demoPreview,
  isUploadingDemo,
  t,
  onSelect,
  onRemove,
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaVideo className="text-purple-600" /> {t('demo_video')}
      </h2>
      <div className="flex flex-col items-center">
        {demoPreview ? (
          <div className="relative w-full">
            <video controls src={demoPreview} className="rounded-md w-full max-h-64 border" />
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              <FaTrash size={14} />
            </button>
          </div>
        ) : (
          <div className="w-full h-40 bg-gray-100 flex flex-col items-center justify-center rounded-lg mb-4 border-2 border-dashed border-gray-300">
            <FaVideo className="text-3xl text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">{t('upload_video')}</p>
          </div>
        )}
        <label className="cursor-pointer">
          <input type="file" accept="video/*" onChange={onSelect} className="hidden" />
          <div className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
            {isUploadingDemo ? <FaSpinner className="animate-spin" /> : <FaUpload />}
            {demoPreview ? t('change_video') : t('upload_video')}
          </div>
        </label>
      </div>
    </div>
  );
}
