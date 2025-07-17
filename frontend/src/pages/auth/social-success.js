import { useRouter } from 'next/router';
import { useEffect } from 'react';
import useAuthStore from '@/store/auth/authStore';
import { getFullProfile } from '@/services/profile/profileService';

export default function SocialSuccess() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const token = router.query.token;
    if (!token) return;
    setToken(token);
    getFullProfile()
      .then((res) => {
        setUser(res.data);
        router.replace('/website');
      })
      .catch(() => router.replace('/auth/login'));
  }, [router.query.token]);

  return <p className="text-center mt-20">Signing in...</p>;
}
