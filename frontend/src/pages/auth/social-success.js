import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '@/store/auth/authStore';
import useNotificationStore from '@/store/notifications/notificationStore';
import { getFullProfile } from '@/services/profile/profileService';
import { useTranslation } from 'next-i18next';

export default function SocialSuccess() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const { t } = useTranslation('auth');

  useEffect(() => {
    const { token } = router.query;
    if (!token) return;
    async function finalize() {
      setToken(token);
      try {
        const res = await getFullProfile();
        setUser(res.data);
        fetchNotifications();
      } catch (err) {
        console.error('Failed to fetch profile after social login', err);
      }
      router.replace('/website');
    }
    finalize();
  }, [router, setToken, setUser, fetchNotifications]);

  return <p className="text-center mt-20">{t('signing_you_in')}</p>;
}
