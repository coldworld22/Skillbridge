import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../next-i18next.config.js';
import AdminLayout from '@/components/layouts/AdminLayout';
import InstructorCard from '@/components/admin/instructors/InstructorCard';
import FilterBar from '@/components/admin/instructors/FilterBar';
import BulkActions from '@/components/admin/instructors/BulkActions';
import InstructorDetailsModal from '@/components/admin/instructors/InstructorDetailsModal';
import {
  fetchAllInstructors,
  updateInstructorStatus,
  deleteInstructor as apiDeleteInstructor,
} from '@/services/admin/instructorService';
import useAuthStore from '@/store/auth/authStore';
import { toast } from 'react-toastify';


export default function AdminInstructorsPage() {
  const { t } = useTranslation('dashboard', { keyPrefix: 'instructorsPage' });
  const { t: tCommon } = useTranslation('common');
  const [instructors, setInstructors] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewInstructor, setViewInstructor] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
      router.replace('/error/403');
      return;
    }

    const loadData = async () => {
      try {
        const { instructors: data, meta } = await fetchAllInstructors(1, 20);
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
        setHasMore(meta?.hasNextPage ?? formatted.length >= 20);
        setPage(1);
      } catch (err) {
        toast.error(t('failed_to_load'));
        console.error('Instructor load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [accessToken, hasHydrated, router, user, t]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const { instructors: data, meta } = await fetchAllInstructors(nextPage, 20);
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
      setInstructors((prev) => [...prev, ...formatted]);
      setHasMore(meta?.hasNextPage ?? formatted.length >= 20);
      setPage(nextPage);
    } catch (err) {
      toast.error(t('failed_to_load'));
      console.error('Instructor load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleStatus = async (id) => {
    const inst = instructors.find((i) => i.id === id);
    if (!inst) return;
    const newStatus = inst.status ? 'inactive' : 'active';
    try {
      await updateInstructorStatus(id, newStatus);
      setInstructors((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: !i.status } : i))
      );
      toast.success(t('status_updated'));
    } catch (err) {
      toast.error(t('update_failed'));
      console.error('Status update error:', err);
    }
  };

  const deleteInstructor = async (id) => {
    try {
      await apiDeleteInstructor(id);
      setInstructors((prev) => prev.filter((i) => i.id !== id));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      toast.success(t('instructor_deleted'));
    } catch (err) {
      toast.error(t('delete_failed'));
      console.error('Delete instructor error:', err);
    }
  };

  const deleteSelected = async () => {
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => apiDeleteInstructor(id))
      );
      const succeeded = selectedIds.filter((_, idx) => results[idx].status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');
      if (succeeded.length) {
        setInstructors((prev) => prev.filter((i) => !succeeded.includes(i.id)));
        setSelectedIds((prev) => prev.filter((id) => !succeeded.includes(id)));
        toast.success(t('selected_deleted'));
      }
      if (failed.length) {
        toast.error(t('delete_selected_failed'));
      }
    } catch (err) {
      toast.error(t('delete_selected_failed'));
      console.error('Bulk delete error:', err);
    }
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
        <p className="text-gray-500 text-lg">{tCommon('loading')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-gray-500">{t('loading')}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>

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
                aria-label={t('select_instructor', { name: instructor.name })}
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

        {hasMore && (
          <div className="text-center mt-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              {loadingMore ? t('loading') : t('load_more')}
            </button>
          </div>
        )}

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

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard', 'common'], nextI18NextConfig)),
    },
  };
}
