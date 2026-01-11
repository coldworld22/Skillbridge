import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import useAuthStore from '@/store/auth/authStore';
import useNotificationStore from '@/store/notifications/notificationStore';
import { getFullProfile } from '@/services/profile/profileService';
import { fetchMemberships, refreshAccessToken } from '@/services/auth/authService';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import { getPostLoginDestination, sanitizeRedirectPath } from '@/utils/auth/postLoginRedirect';
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import styles from "@/shared/components/auth/auth.module.scss";

export default function SocialSuccess() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const setMemberships = useAuthStore((state) => state.setMemberships);
  const setCurrentTenantId = useAuthStore((state) => state.setCurrentTenantId);
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const { t } = useTranslation('auth');
  const redirectPath = useMemo(() => {
    if (!router.isReady) return null;
    const raw = router.query.redirect ?? router.query.next;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return sanitizeRedirectPath(value);
  }, [router.isReady, router.query.next, router.query.redirect]);

  useEffect(() => {
    if (!router.isReady) return;
    async function finalize() {
      try {
        const { accessToken } = await refreshAccessToken();
        setToken(accessToken);
        const res = await getFullProfile();
        const profile = res.data;
        setUser(profile);
        try {
          const membershipRes = await fetchMemberships();
          setMemberships(membershipRes?.data || []);
          setCurrentTenantId(membershipRes?.currentTenantId || null);
        } catch (membershipErr) {
          console.warn("Failed to load memberships after social login", membershipErr);
        }
        if (profile.profile_complete && profile.is_email_verified) {
          fetchNotifications();
        }
        toast.success(t('login_successful'));
        const destination = getPostLoginDestination({
          user: profile,
          redirectPath,
        });
        router.replace(destination);
        return;
      } catch (err) {
        console.error('Failed to fetch profile after social login', err);
        toast.error(t('login_failed'));
      }
      router.replace('/auth/login');
    }
    finalize();
  }, [router, router.isReady, setToken, setUser, fetchNotifications, t, redirectPath]);

  return (
    <div className={styles.authPage}>
      <BackgroundAnimation />
      <div className={`${styles.card} ${styles.compactCard}`}>
        <p className={styles.statusText}>{t('signing_you_in')}</p>
      </div>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'auth'], nextI18NextConfig)),
    },
  };
}
