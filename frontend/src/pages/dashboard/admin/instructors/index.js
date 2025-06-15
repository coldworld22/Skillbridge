import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import InstructorCard from '@/components/admin/instructors/InstructorCard';
import FilterBar from '@/components/admin/instructors/FilterBar';
import BulkActions from '@/components/admin/instructors/BulkActions';
import InstructorDetailsModal from '@/components/admin/instructors/InstructorDetailsModal';
import { fetchAllInstructors, updateInstructorStatus } from '@/services/admin/instructorService';
import useAuthStore from '@/store/auth/authStore';
import { toast } from 'react-toastify';


export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewInstructor, setViewInstructor] = useState(null);

  const router = useRouter();
  const { accessToken, user, hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!accessToken || !user) {
      router.replace('/auth/login');
      return;
    }

    const role = user.role?.toLowerCase() ?? '';
    if (role !== 'admin' && role !== 'superadmin') {
      router.replace('/403');
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchAllInstructors();
        const formatted = (data ?? []).map((i) => ({
          id: i.id,
          name: i.full_name || i.email?.split('@')[0],
          email: i.email,
          avatar: i.avatar_url
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${i.avatar_url}`
            : 'https://via.placeholder.com/80',
          status: i.status === 'active' || i.status === true,
          joinDate: i.created_at
            ? new Date(i.created_at).toISOString().split('T')[0]
            : '',
          bio: i.expertise || '',
          classes: [],
        }));
        setInstructors(formatted);
      } catch (err) {
        toast.error('Failed to load instructors');
        console.error('Instructor load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [accessToken, hasHydrated, router, user]);

  const toggleStatus = async (id) => {
    const inst = instructors.find((i) => i.id === id);
    if (!inst) return;
    const newStatus = inst.status ? 'inactive' : 'active';
    try {
      await updateInstructorStatus(id, newStatus);
      setInstructors((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: !i.status } : i))
      );
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status');
      console.error('Status update error:', err);
    }
  };

  const deleteInstructor = (id) => {
    setInstructors((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  const deleteSelected = () => {
    setInstructors((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
    setSelectedIds([]);
  };

  const updateInstructor = (updated) => {
    setInstructors((prev) =>
      prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i))
    );
    setViewInstructor(null);
  };

  const closeModal = () => {
    setViewInstructor(null);
  };

  const visibleInstructors = instructors
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .filter((i) =>
      statusFilter === 'all' ? true : statusFilter === 'active' ? i.status : !i.status
    )
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'date') return new Date(b.joinDate) - new Date(a.joinDate);
      return 0;
    });

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-gray-500">Loading instructors...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Instructors</h1>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
        />

        <BulkActions
          selectedIds={selectedIds}
          onSelectAll={setSelectedIds}
          allVisibleIds={visibleInstructors.map((i) => i.id)}
          onDeleteSelected={deleteSelected}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleInstructors.map((instructor) => (
            <div key={instructor.id} className="relative">
              <input
                type="checkbox"
                className="absolute top-2 left-2 z-10"
                checked={selectedIds.includes(instructor.id)}
                onChange={(e) => {
                  setSelectedIds((prev) =>
                    e.target.checked
                      ? [...prev, instructor.id]
                      : prev.filter((id) => id !== instructor.id)
                  );
                }}
              />
              <InstructorCard
                instructor={instructor}
                onToggle={toggleStatus}
                onDelete={deleteInstructor}
                onView={() => setViewInstructor({ ...instructor })}
              />
            </div>
          ))}
        </div>

        {viewInstructor && (
          <InstructorDetailsModal
            instructor={viewInstructor}
            onClose={closeModal}
            onSave={updateInstructor}
            useTabs={true}
          />
        )}
      </div>
    </AdminLayout>
  );
}