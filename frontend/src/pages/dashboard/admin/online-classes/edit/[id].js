// pages/dashboard/admin/online-classes/edit/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';

export default function EditClassPage() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    date: '',
    endDate: '',
    category: '',
    price: '',
    status: '',
    description: '',
    studentLimit: '',
  });

  useEffect(() => {
    if (id) {
      // Simulate fetching data by ID
      const fakeData = {
        title: 'React & Next.js Bootcamp',
        instructor: 'Ayman Khalid',
        date: '2025-05-13',
        endDate: '2025-06-13',
        category: 'Web Development',
        price: 49,
        status: 'Upcoming',
        description: 'A hands-on bootcamp for frontend development using React and Next.js.',
        studentLimit: 50,
      };
      setFormData(fakeData);
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Class '${formData.title}' updated!`);
    router.push('/dashboard/admin/online-classes');
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-xl mt-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">✏️ Edit Class</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Class Title"
          className="w-full border rounded px-4 py-2"
        />
        <input
          name="instructor"
          value={formData.instructor}
          onChange={handleChange}
          placeholder="Instructor"
          className="w-full border rounded px-4 py-2"
        />
        <div className="flex gap-4">
          <input
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
          <input
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
        </div>
        <input
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="Category"
          className="w-full border rounded px-4 py-2"
        />
        <input
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          placeholder="Price"
          className="w-full border rounded px-4 py-2"
        />
        <input
          name="studentLimit"
          type="number"
          value={formData.studentLimit}
          onChange={handleChange}
          placeholder="Max Students"
          className="w-full border rounded px-4 py-2"
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Class Description"
          className="w-full border rounded px-4 py-2 h-24"
        />
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full border rounded px-4 py-2"
        >
          <option value="">Select Status</option>
          <option value="Pending">Pending</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
        </select>

        <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded shadow">
          Save Changes
        </button>
      </form>
    </div>
  );
}

EditClassPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};