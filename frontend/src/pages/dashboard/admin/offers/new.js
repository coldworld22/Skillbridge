import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import AdminLayout from "@/components/layouts/AdminLayout";
import { createOffer } from "@/services/admin/offerService";
import withAdminGuard from "@/hooks/withAdminGuard";

const NewOfferPage = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    price: "",
    timeframe: "",
    offerType: "class",
    expiresAt: "",
    tags: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await createOffer({
        title: form.title,
        description: form.description,
        budget: form.price,
        timeframe: form.timeframe,
        offer_type: form.offerType,
        expires_at: form.expiresAt || undefined,
        tags: JSON.stringify(tags),
      });
      toast.success("Offer created successfully");
      router.push("/dashboard/admin/offers");
    } catch (error) {
      toast.error("Failed to create offer");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow mt-10 mb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📢 Post New Learning Request</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="e.g. Need Help with Algebra"
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
            placeholder="$150"
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Timeframe</label>
          <input
            name="timeframe"
            value={form.timeframe}
            onChange={handleChange}
            required
            placeholder="e.g. 3 months"
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Offer Type</label>
          <select
            name="offerType"
            value={form.offerType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-4 py-2"
          >
            <option value="class">Class</option>
            <option value="tutorial">Tutorial</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Expires At</label>
          <input
            type="date"
            name="expiresAt"
            value={form.expiresAt}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Tags (comma separated)</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Urgent, Online"
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
            placeholder="Briefly describe your learning need..."
            className="w-full border border-gray-300 rounded px-4 py-2"
          ></textarea>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold"
          >
            Post Offer
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 underline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

NewOfferPage.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

const ProtectedNewOfferPage = withAdminGuard(NewOfferPage);

ProtectedNewOfferPage.getLayout = NewOfferPage.getLayout;

export default ProtectedNewOfferPage;
