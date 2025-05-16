import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import InstructorCard from '@/components/admin/instructors/InstructorCard';
import FilterBar from '@/components/admin/instructors/FilterBar';
import BulkActions from '@/components/admin/instructors/BulkActions';
import InstructorDetailsModal from '@/components/admin/instructors/InstructorDetailsModal';

const mockInstructors = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    status: true,
    joinDate: '2024-12-15',
    bio: 'Expert in business leadership and soft skills.',
    classes: ['Leadership 101', 'Team Building Basics'],
  },
  {
    id: 2,
    name: 'Mark Lee',
    email: 'mark@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    status: false,
    joinDate: '2025-01-08',
    bio: 'Full-stack web developer and mentor.',
    classes: ['Advanced React', 'Node.js Masterclass'],
  },
  {
    id: 3,
    name: 'Linda Adams',
    email: 'linda@example.com',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    status: true,
    joinDate: '2024-11-23',
    bio: 'Specialist in medical education and anatomy.',
    classes: ['Human Anatomy', 'Basic First Aid'],
  },
];

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewInstructor, setViewInstructor] = useState(null);

  useEffect(() => {
    setInstructors(mockInstructors);
  }, []);

  const toggleStatus = (id) => {
    setInstructors((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: !i.status } : i))
    );
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