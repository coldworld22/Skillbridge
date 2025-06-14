import { FaCheckCircle, FaEdit } from "react-icons/fa";

export default function ReviewStep({ tutorialData, onBack, onPublish }) {
  return (
    <div className="space-y-8">

      {/* Review Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">✅ Review & Publish</h2>
        <button
          onClick={onBack}
          className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-full font-bold"
        >
          ⬅️ Back
        </button>
      </div>

      {/* Summary Box */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">

        {/* Basic Info */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-yellow-600 flex items-center gap-2">
            <FaCheckCircle /> Basic Info
          </h3>
          <p><strong>Title:</strong> {tutorialData.title}</p>
          <p><strong>Short Description:</strong> {tutorialData.shortDescription}</p>
          <p>
            <strong>Category:</strong>{" "}
            {tutorialData.categoryName || tutorialData.category}
          </p>
          <p><strong>Level:</strong> {tutorialData.level}</p>
          {tutorialData.tags.length > 0 && (
            <p><strong>Tags:</strong> {tutorialData.tags.join(", ")}</p>
          )}
        </div>

        {/* Curriculum */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-yellow-600 flex items-center gap-2">
            <FaCheckCircle /> Curriculum
          </h3>
          {tutorialData.chapters.length > 0 ? (
            <ul className="list-disc pl-5">
              {tutorialData.chapters.map((chapter, index) => (
                <li key={index}>
                  {chapter.title} ({chapter.duration})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No chapters added yet.</p>
          )}
        </div>

        {/* Media */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-yellow-600 flex items-center gap-2">
            <FaCheckCircle /> Media
          </h3>
          <div className="flex gap-6 items-center">
            {tutorialData.thumbnail instanceof File && (
              <img
                src={URL.createObjectURL(tutorialData.thumbnail)}
                alt="Thumbnail Preview"
                className="w-32 h-20 object-cover rounded shadow"
              />
            )}
            {tutorialData.preview instanceof File && (
              <video
                src={URL.createObjectURL(tutorialData.preview)}
                controls
                className="w-32 h-20 rounded shadow"
              />
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-yellow-600 flex items-center gap-2">
            <FaCheckCircle /> Pricing
          </h3>
          {tutorialData.isFree ? (
            <p className="text-green-600 font-semibold">This tutorial will be FREE</p>
          ) : (
            <p className="text-gray-800">
              <strong>Price:</strong> ${tutorialData.price}
            </p>
          )}
        </div>

      </div>

      {/* Publish Button */}
      <div className="text-center mt-8">
        <button
          onClick={onPublish}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-full font-bold text-xl transition-all shadow-lg"
        >
          🚀 Publish Tutorial
        </button>
      </div>

    </div>
  );
}
