import { useState } from "react";
import { useRouter } from "next/router";
import InstructorLayout from '@/components/layouts/InstructorLayout';

export default function CreateClassPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    duration: "",
    studentLimit: "",
    price: "",
    category: "",
    allowInstallments: false,
    coverImage: null,
    tags: "",
    prerequisites: "",
    status: "Upcoming",
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    console.log("Class Created:", { ...formData, id: slug });
    router.push("/dashboard/instructor/online-classe");
  };

  return (
    <InstructorLayout>
      <div className="min-h-screen bg-white px-6 py-10 text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">🎓 Create New Class</h1>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Class Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border p-3 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border p-3 rounded h-32"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full border p-3 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full border p-3 rounded"
                placeholder="e.g., 4 weeks"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Student Limit</label>
              <input
                type="number"
                name="studentLimit"
                value={formData.studentLimit}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price (USD)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border p-3 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cover Image</label>
            <input
              type="file"
              name="coverImage"
              accept="image/*"
              onChange={handleChange}
              className="w-full border p-3 rounded bg-white"
            />
            {formData.coverImage && (
              <img
                src={URL.createObjectURL(formData.coverImage)}
                alt="Cover Preview"
                className="mt-3 w-full max-h-64 object-cover rounded shadow"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Skills/Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full border p-3 rounded"
              placeholder="e.g., JavaScript, React, Web Dev"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prerequisites</label>
            <textarea
              name="prerequisites"
              value={formData.prerequisites}
              onChange={handleChange}
              className="w-full border p-3 rounded h-20"
              placeholder="Mention any required prior knowledge or tools"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Class Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="allowInstallments"
              checked={formData.allowInstallments}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <label className="text-sm">Allow Installment Payments</label>
          </div>

          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded shadow"
          >
            Create Class
          </button>
        </form>
      </div>
    </InstructorLayout>
  );
}
