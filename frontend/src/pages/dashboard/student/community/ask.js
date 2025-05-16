import { useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { FaPaperPlane } from "react-icons/fa";
import { useRouter } from "next/router";

const availableTags = ["React", "Odoo", "Next.js", "APIs", "UI/UX", "Authentication"];

export default function AskQuestionPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Please enter a question title.");
    // Here you'd call an API to save the question
    console.log({ title, description, selectedTags });
    setSubmitted(true);
    setTimeout(() => router.push("/dashboard/student/community"), 1000);
  };

  return (
    <StudentLayout title="Ask a Question">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Details (optional)</label>
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
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      selectedTags.includes(tag)
                        ? "bg-yellow-500 text-white border-yellow-500"
                        : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    #{tag}
                  </button>
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
