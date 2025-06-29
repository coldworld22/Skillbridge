import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { toast } from "react-toastify";
import { fetchOfferById } from "@/services/offerService";
import { updateOffer } from "@/services/admin/offerService";
import { fetchOfferTags, createOfferTag } from "@/services/offerTagService";


const EditOfferPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState({
    title: "",
    price: "",
    duration: "",
    description: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTags, setNewTags] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [offer, setOffer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const search = tagInput.trim();
    if (!search) return setSuggestedTags([]);
    fetchOfferTags(search).then(setSuggestedTags).catch(() => {});
  }, [tagInput]);

  // Load existing data from API
  useEffect(() => {
    if (!id) return;

    fetchOfferById(id)
      .then((offerData) => {
        if (!offerData) return;
        setOffer(offerData);
        setForm({
          title: offerData.title || "",
          price: offerData.budget || "",
          duration: offerData.timeframe || "",
          description: offerData.description || "",
        });
        if (Array.isArray(offerData.tags)) {
          setSelectedTags(offerData.tags.map((t) => t.name));
        }
      })
      .catch(() => {
        toast.error("Failed to load offer details.");
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addTag = async (name) => {
    const tag = name.trim();
    if (!tag || selectedTags.includes(tag)) return;

    try {
      const result = await fetchOfferTags(tag);
      const exists = result.some((t) => t.name.toLowerCase() === tag.toLowerCase());
      if (!exists) {
        await createOfferTag({ name: tag });
        setNewTags((prev) => [...prev, tag]);
      }
    } catch (_) {}

    setSelectedTags((prev) => [...prev, tag]);
    setTagInput("");
  };

  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
    setNewTags((prev) => prev.filter((t) => t !== tag));
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
      await updateOffer(id, payload);

      toast.success("Offer updated successfully!");
      router.push("/dashboard/instructor/offers");
    } catch (error) {
      toast.error("Failed to update offer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow mt-10 mb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">✏️ Edit Offer</h1>

      {offer && (
        <div className="p-4 mb-6 bg-gray-50 rounded shadow">
          <h2 className="font-semibold mb-2 text-gray-700">Current Details</h2>
          <p className="text-sm text-gray-600"><strong>Title:</strong> {offer.title}</p>
          <p className="text-sm text-gray-600"><strong>Budget:</strong> {offer.budget}</p>
          <p className="text-sm text-gray-600"><strong>Duration:</strong> {offer.timeframe}</p>
          <p className="text-sm text-gray-600"><strong>Description:</strong> {offer.description}</p>
          {Array.isArray(offer.tags) && (
            <p className="text-sm text-gray-600">
              <strong>Tags:</strong> {offer.tags.map((t) => t.name).join(", ")}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Price</label>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Duration</label>
          <input
            name="duration"
            value={form.duration}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Tags</label>
          <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded px-2 py-1">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className={`px-2 py-1 text-xs rounded-full flex items-center ${
                  newTags.includes(tag) ? "bg-yellow-200" : "bg-gray-200"
                }`}
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
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded px-4 py-2"
          ></textarea>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded font-semibold ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 underline"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

EditOfferPage.getLayout = (page) => (
  <InstructorLayout>{page}</InstructorLayout>
);

export default EditOfferPage;
