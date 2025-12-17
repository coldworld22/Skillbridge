import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '@/store/auth/authStore';

export default function ExploreGroupsRedirect() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    const role = user?.role?.toLowerCase() || 'student';
    const target = ['admin', 'superadmin'].includes(role) ? 'admin' : role;
    router.replace(`/dashboard/${target}/groups/explore`);
  }, [user, hasHydrated, router]);

  return null;
}
