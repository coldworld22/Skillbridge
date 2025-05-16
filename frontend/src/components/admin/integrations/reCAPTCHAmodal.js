export default function ReCAPTCHAModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">reCAPTCHA v3 Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Site Key</label>
            <input
              type="text"
              placeholder="e.g., 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Secret Key</label>
            <input
              type="text"
              placeholder="Your secret key"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Threshold Score</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              defaultValue={0.5}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
