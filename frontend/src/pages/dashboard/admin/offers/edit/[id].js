import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";

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

  // Load existing data (mock)
  useEffect(() => {
    if (!id) return;

    const mockOffers = Array.from({ length: 12 }, (_, i) => ({
      id: `${i + 1}`,
      userId: "student1",
      type: "student",
      title: `Need Help with Subject ${i + 1}`,
      price: `$${100 + i * 10}`,
      duration: `${1 + i % 6} months`,
      tags: ["Flexible", "LiveClass"].slice(0, (i % 2) + 1).join(", "),
      description: `Looking for help with subject ${i + 1}.`,
    }));

    const found = mockOffers.find((o) => o.id === id);
    if (found) {
      setForm({
        title: found.title,
        price: found.price,
        duration: found.duration,
        tags: found.tags,
        description: found.description,
      });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate save
    alert("Offer updated successfully!");
    router.push("/dashboard/student/offers");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow mt-10 mb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">✏️ Edit Offer</h1>

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
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded font-semibold"
          >
            Save Changes
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

EditOfferPage.getLayout = (page) => <StudentLayout>{page}</StudentLayout>;

export default EditOfferPage;
