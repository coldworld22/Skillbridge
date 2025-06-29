import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { toast } from "react-toastify";
import { fetchOfferById } from "@/services/offerService";
import { updateOffer } from "@/services/admin/offerService";


const EditOfferPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState({
    title: "",
    price: "",
    duration: "",
    tags: "",
    description: "",
  });
  const [offer, setOffer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          tags: offerData.tags ? offerData.tags.map((t) => t.name).join(", ") : "",
          description: offerData.description || "",
        });
      })
      .catch(() => {
        toast.error("Failed to load offer details.");
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        tags: JSON.stringify(
          form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        ),
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
          <label className="block font-medium mb-1">Tags (comma separated)</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
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
