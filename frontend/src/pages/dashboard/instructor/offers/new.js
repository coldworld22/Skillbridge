import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchOfferTags, createOfferTag } from "@/services/offerTagService";
import { createOffer } from "@/services/offerService";

const NewOfferPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    price: "",
    duration: "",
    description: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);

  useEffect(() => {
    const search = tagInput.trim();
    if (!search) return setSuggestedTags([]);
    fetchOfferTags(search).then(setSuggestedTags).catch(() => {});
  }, [tagInput]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addTag = async (name) => {
    const tag = name.trim();
    if (!tag || selectedTags.includes(tag)) return;
    const exists = suggestedTags.some((t) => t.name.toLowerCase() === tag.toLowerCase());
    if (!exists) {
      try {
        await createOfferTag({ name: tag });
      } catch (_) {}
    }
    setSelectedTags((prev) => [...prev, tag]);
    setTagInput("");
  };

  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        budget: form.price,
        timeframe: form.duration,
        tags: JSON.stringify(selectedTags),
      };
      await createOffer(payload);
      toast.success("Your service offer has been posted successfully!");
      router.push("/dashboard/instructor/offers");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("There was an error submitting your offer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-md mt-10 mb-10 border border-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">📢 Post New Service Offer</h1>
      <p className="text-gray-600 mb-6">Fill out the form below to describe the service you are offering</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="e.g. I will create a class"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                required
                placeholder="100"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-7 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <input
              name="duration"
              value={form.duration}
              onChange={handleChange}
              required
              placeholder="e.g. 1 month"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded-lg px-2 py-1">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded-full flex items-center bg-yellow-200"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-gray-600 hover:text-gray-900">
                  &times;
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              className="flex-grow py-2 focus:outline-none"
              placeholder="Add tag"
            />
          </div>
          {suggestedTags.length > 0 && tagInput && (
            <div className="flex flex-wrap gap-2 mt-1">
              {suggestedTags.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => addTag(tag.name)}
                  className="bg-gray-200 hover:bg-gray-300 text-xs px-2 py-1 rounded-full"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            placeholder="Provide details about the service you will deliver..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          ></textarea>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting...
              </>
            ) : (
              "Post Offer"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:border-gray-400 transition-all"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

NewOfferPage.getLayout = (page) => <InstructorLayout>{page}</InstructorLayout>;

export default NewOfferPage;
