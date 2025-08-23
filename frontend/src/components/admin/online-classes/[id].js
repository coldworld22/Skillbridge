import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { fetchAdminClassById } from '@/services/admin/classService';

export default function AdminClassDetails() {
  const { id } = useRouter().query;
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchAdminClassById(id)
      .then(setCls)
      .catch(() => setCls(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AdminLayout>
      <div className="p-6">
        {loading ? (
          <p>Loading class...</p>
        ) : cls ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">{cls.title}</h1>
            <p><strong>Instructor:</strong> {cls.instructor}</p>
            <p><strong>Schedule:</strong> {cls.start_date} {cls.end_date && `- ${cls.end_date}`}</p>
            {cls.price !== undefined && (
              <p><strong>Price:</strong> ${cls.price}</p>
            )}
            <p><strong>Status:</strong> {cls.publishStatus}</p>
          </div>
        ) : (
          <p>Class not found.</p>
        )}
      </div>
    </AdminLayout>
  );
}
