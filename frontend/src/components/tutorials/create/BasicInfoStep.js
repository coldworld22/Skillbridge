import { useState } from "react";

export default function BasicInfoStep({ tutorialData, setTutorialData, onNext, categories = [] }) {
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setTutorialData((prev) => ({ ...prev, [field]: value }));
  };

  const validateAndContinue = () => {
    const newErrors = {};

    if (!tutorialData.title) newErrors.title = "Title is required.";
    if (!tutorialData.shortDescription) newErrors.shortDescription = "Short description is required.";
    if (!tutorialData.category) newErrors.category = "Category is required.";
    if (!tutorialData.level) newErrors.level = "Level is required.";
    if (!tutorialData.language) newErrors.language = "Tutorial language is required.";
    if (!tutorialData.isFree && (!tutorialData.price || isNaN(tutorialData.price))) newErrors.price = "Valid price is required.";
    if (!tutorialData.startDate) newErrors.startDate = "Start date is required.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="font-semibold">Tutorial Title *</label>
        <input
          type="text"
          className="w-full p-2 border rounded mt-1"
          value={tutorialData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Write tutorial title in any language..."
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Short Description */}
      <div>
        <label className="font-semibold">Short Description *</label>
        <textarea
          rows={4}
          className="w-full p-2 border rounded mt-1"
          value={tutorialData.shortDescription}
          onChange={(e) => handleChange("shortDescription", e.target.value)}
          placeholder="Briefly describe the tutorial content..."
        />
        {errors.shortDescription && <p className="text-red-500 text-sm mt-1">{errors.shortDescription}</p>}
      </div>

      {/* Language */}
      <div>
        <label className="font-semibold">Tutorial Language *</label>
        <input
          type="text"
          className="w-full p-2 border rounded mt-1"
          value={tutorialData.language || ""}
          onChange={(e) => handleChange("language", e.target.value)}
          placeholder="e.g., English, Arabic, French..."
        />
        {errors.language && <p className="text-red-500 text-sm mt-1">{errors.language}</p>}
      </div>

      {/* Start Date */}
      <div>
        <label className="font-semibold">Start Date *</label>
        <input
          type="date"
          className="w-full p-2 border rounded mt-1"
          value={tutorialData.startDate}
          onChange={(e) => handleChange("startDate", e.target.value)}
        />
        {errors.startDate && (
          <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
        )}
      </div>

      {/* End Date */}
      <div>
        <label className="font-semibold">End Date</label>
        <input
          type="date"
          className="w-full p-2 border rounded mt-1"
          value={tutorialData.endDate}
          onChange={(e) => handleChange("endDate", e.target.value)}
        />
      </div>

      {/* Category */}
      <div>
        <label className="font-semibold">Category *</label>
        <select
          className="w-full p-2 border rounded mt-1"
          value={tutorialData.category}
          onChange={(e) => {
            const selected = categories.find((c) => c.id === e.target.value);
            handleChange("category", e.target.value);
            handleChange("categoryName", selected ? selected.name : "");
          }}
        >
          <option value="">Select a Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-sm mt-1">{errors.category}</p>
        )}
      </div>

      {/* Level */}
      <div>
        <label className="font-semibold">Level *</label>
        <select
          className="w-full p-2 border rounded mt-1"
          value={tutorialData.level}
          onChange={(e) => handleChange("level", e.target.value)}
        >
          <option value="">Select Level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level}</p>}
      </div>

      {/* Tags */}
      <div>
        <label className="font-semibold">Tags (comma separated)</label>
        <input
          type="text"
          className="w-full p-2 border rounded mt-1"
          value={tutorialData.tags.join(", ")}
          onChange={(e) => handleChange("tags", e.target.value.split(",").map(tag => tag.trim()))}
          placeholder="e.g., Frontend, JavaScript, Web Development"
        />
      </div>

      {/* Is Free + Price */}
      <div className="flex items-center gap-4">
        <label className="font-semibold">Is it Free?</label>
        <input
          type="checkbox"
          checked={tutorialData.isFree}
          onChange={(e) => handleChange("isFree", e.target.checked)}
          className="form-checkbox h-5 w-5 text-yellow-500"
        />
      </div>

      {!tutorialData.isFree && (
        <div>
          <label className="font-semibold">Price (USD) *</label>
          <input
            type="number"
            className="w-full p-2 border rounded mt-1"
            value={tutorialData.price}
            onChange={(e) => handleChange("price", e.target.value)}
            placeholder="Enter price, e.g., 19.99"
          />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
        </div>
      )}

      {/* NEXT BUTTON */}
      <div className="flex justify-end">
        <button
          onClick={validateAndContinue}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-full font-bold"
        >
          Next ➡️
        </button>
      </div>
    </div>
  );
}
