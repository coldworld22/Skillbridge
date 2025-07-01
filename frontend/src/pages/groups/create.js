import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '@/store/auth/authStore';
import GroupForm from '@/components/groups/GroupForm';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import StudentLayout from '@/components/layouts/StudentLayout';

export default function CreateGroupPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !user) {
      router.push('/auth/login?returnTo=/groups/create');
    }
  }, [user, hasHydrated, router]);

  if (!hasHydrated || !user) return null;

  const layoutMap = {
    instructor: InstructorLayout,
    student: StudentLayout,
  };

  const Layout = layoutMap[user.role?.toLowerCase()] || StudentLayout;

  return (
    <Layout>
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create a New Group</h1>
        <GroupForm />
      </div>
    </Layout>
  );
}
