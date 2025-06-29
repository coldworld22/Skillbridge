import { useState, useEffect, useMemo } from "react";
import { fetchTutorialTags } from "@/services/instructor/tutorialTagService";

export default function BasicInfoStep({ tutorialData, setTutorialData, onNext, categories = [] }) {
  const [errors, setErrors] = useState({});
  const [allTags, setAllTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const filteredTagSuggestions = useMemo(
    () =>
      allTags.filter(
        (t) =>
          tagInput &&
          t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
          !tutorialData.tags.includes(t.name)
      ),
    [allTags, tagInput, tutorialData.tags]
  );

  useEffect(() => {
    fetchTutorialTags()
      .then(setAllTags)
      .catch(() => setAllTags([]));
  }, []);

  const handleChange = (field, value) => {
    setTutorialData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = (tag) => {
    if (tag && !tutorialData.tags.includes(tag)) {
      setTutorialData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTutorialData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const validateAndContinue = () => {
    const newErrors = {};

    if (!tutorialData.title) newErrors.title = "Title is required.";
    if (!tutorialData.shortDescription) newErrors.shortDescription = "Short description is required.";
    if (!tutorialData.category) newErrors.category = "Category is required.";
    if (!tutorialData.level) newErrors.level = "Level is required.";
    if (!tutorialData.language) newErrors.language = "Tutorial language is required.";
    if (!tutorialData.isFree && (!tutorialData.price || isNaN(tutorialData.price))) newErrors.price = "Valid price is required.";

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
        <label className="font-semibold">Tags</label>
        <div className="relative">
          <div className="flex flex-wrap gap-2 mb-2">
            {tutorialData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1.5 inline-flex text-yellow-500 hover:text-yellow-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            placeholder="Add tags..."
            className="w-full p-2 border rounded mt-1"
          />
          {filteredTagSuggestions.length > 0 && tagInput && (
            <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
              {filteredTagSuggestions.map((t) => (
                <div
                  key={t.id}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 cursor-pointer"
                  onClick={() => addTag(t.name)}
                >
                  {t.name}
                </div>
              ))}
            </div>
          )}
        </div>
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
