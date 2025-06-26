import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import FloatingInput from '@/components/shared/FloatingInput';
import { fetchInstructorClassById, updateInstructorClass } from '@/services/instructor/classService';

export default function EditInstructorClass() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({ title: '', start_date: '', end_date: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchInstructorClassById(id);
        if (data) {
          setFormData({
            title: data.title || '',
            start_date: data.start_date || '',
            end_date: data.end_date || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id) return;
    const payload = new FormData();
    payload.append('title', formData.title);
    if (formData.start_date) payload.append('start_date', formData.start_date);
    if (formData.end_date) payload.append('end_date', formData.end_date);
    await updateInstructorClass(id, payload);
    router.push(`/dashboard/instructor/online-classes/${id}/details`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Class</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <FloatingInput label="Title" name="title" value={formData.title} onChange={handleChange} />
          <FloatingInput label="Start Date" type="date" name="start_date" value={formData.start_date} onChange={handleChange} />
          <FloatingInput label="End Date" type="date" name="end_date" value={formData.end_date} onChange={handleChange} />
          <button type="submit" className="bg-yellow-500 text-black px-4 py-2 rounded">Save</button>
        </form>
      )}
    </div>
  );
}

EditInstructorClass.getLayout = function getLayout(page) {
  return <InstructorLayout>{page}</InstructorLayout>;
};
