import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '@/store/auth/authStore';
import GroupForm from '@/components/groups/GroupForm';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import StudentLayout from '@/components/layouts/StudentLayout';
import styles from './groups.module.scss';

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
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Create a New Group</h1>
        <GroupForm />
      </div>
    </Layout>
  );
}
