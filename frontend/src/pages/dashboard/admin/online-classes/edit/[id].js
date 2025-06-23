// pages/dashboard/admin/online-classes/edit/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { fetchAdminClassById, updateAdminClass } from '@/services/admin/classService';

export default function EditClassPage() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    start_date: '',
    end_date: '',
    category: '',
    price: '',
    status: '',
    description: '',
    max_students: '',
  });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchAdminClassById(id);
        if (data) {
          setFormData({
            title: data.title || '',
            instructor: data.instructor || '',
            start_date: data.start_date || '',
            end_date: data.end_date || '',
            category: data.category_id || '',
            price: data.price || '',
            status: data.status || '',
            description: data.description || '',
            max_students: data.max_students || '',
          });
        }
      } catch (err) {
        console.error('Failed to load class', err);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateAdminClass(id, {
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        category_id: formData.category,
        price: formData.price,
        max_students: formData.max_students,
        status: formData.status,
      });
      router.push('/dashboard/admin/online-classes');
    } catch (err) {
      console.error('Failed to update class', err);
    }
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
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
          <input
            name="end_date"
            type="date"
            value={formData.end_date}
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
          name="max_students"
          type="number"
          value={formData.max_students}
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
          <option value="draft">Pending</option>
          <option value="published">Approved</option>
          <option value="archived">Rejected</option>
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