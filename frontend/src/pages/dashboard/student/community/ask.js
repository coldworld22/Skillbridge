import { useState, useEffect } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { FaPaperPlane } from "react-icons/fa";
import { useRouter } from "next/router";
import { createDiscussion, searchTags } from "@/services/communityService";
import toast, { Toaster } from "react-hot-toast";

export default function AskQuestionPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!tagInput.trim()) {
      setTagSuggestions([]);
      return;
    }
    const debounce = setTimeout(() => {
      searchTags(tagInput.trim()).then(setTagSuggestions).catch(() => {});
    }, 300);
    return () => clearTimeout(debounce);
  }, [tagInput]);

  const addTag = (tag) => {
    if (!tag || selectedTags.includes(tag)) return;
    setSelectedTags((prev) => [...prev, tag]);
  };

  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput.trim());
      setTagInput("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description required");
      return;
    }
    if (selectedTags.length === 0) {
      toast.error("At least one tag required");
      return;
    }
    try {
      await createDiscussion({ title, content: description, tags: selectedTags });
      setSubmitted(true);
      toast.success("Question submitted");
      setTimeout(() => router.push("/dashboard/student/community"), 1000);
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Failed to submit";
      toast.error(message);
    }
  };

  return (
    <StudentLayout title="Ask a Question">
      <Toaster position="top-center" />
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📝 Ask a New Question</h1>

        {submitted ? (
          <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg font-semibold">
            ✅ Question submitted! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., How do I connect Odoo to an external API?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-yellow-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Details *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Add any details, code snippets, or context here..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-yellow-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  placeholder="Add tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                {tagSuggestions.length > 0 && (
                  <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded shadow max-h-40 overflow-y-auto">
                    {tagSuggestions.map((s) => (
                      <li
                        key={s.id}
                        className="px-3 py-1 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          addTag(s.name);
                          setTagInput("");
                          setTagSuggestions([]);
                        }}
                      >
                        {s.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags.map((t) => (
                  <span key={t} className="bg-yellow-500 text-white px-2 py-1 rounded flex items-center">
                    {t}
                    <button type="button" className="ml-1" onClick={() => removeTag(t)}>
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="text-right">
              <button
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <FaPaperPlane /> Submit Question
              </button>
            </div>
          </form>
        )}
      </div>
    </StudentLayout>
  );
}
