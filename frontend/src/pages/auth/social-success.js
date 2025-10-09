import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import useAuthStore from '@/store/auth/authStore';
import useNotificationStore from '@/store/notifications/notificationStore';
import { getFullProfile } from '@/services/profile/profileService';
import { refreshAccessToken } from '@/services/auth/authService';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export default function SocialSuccess() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const { t } = useTranslation('auth');

  useEffect(() => {
    async function finalize() {
      try {
        const { accessToken } = await refreshAccessToken();
        setToken(accessToken);
        const res = await getFullProfile();
        const profile = res.data;
        setUser(profile);
        if (profile.profile_complete && profile.is_email_verified) {
          fetchNotifications();
        }
        toast.success(t('login_successful'));
        const role = profile.role?.toLowerCase();
        const profilePaths = {
          admin: "/dashboard/admin/profile/edit",
          instructor: "/dashboard/instructor/profile/edit",
          student: "/dashboard/student/profile/edit",
          superadmin: "/dashboard/admin/profile/edit",
        };
        let destination = "/website";
        if (profile.profile_complete === false) {
          destination = profilePaths[role] || "/profile/edit";
        } else if (!profile.is_email_verified) {
          destination = "/auth/verify-email";
        }
        router.replace(destination);
        return;
      } catch (err) {
        console.error('Failed to fetch profile after social login', err);
        toast.error(t('login_failed'));
      }
      router.replace('/auth/login');
    }
    finalize();
  }, [router, setToken, setUser, fetchNotifications, t]);

  return <p className="text-center mt-20">{t('signing_you_in')}</p>;
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'auth'], nextI18NextConfig)),
    },
  };
}
