import { useEffect, useState } from 'react';
import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { getPolicies } from '@/services/policiesService';
import DOMPurify from 'isomorphic-dompurify';
import styles from './privacy-policy.module.scss';

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPolicies();
        setContent(data.privacy_policy?.content || '');
      } catch (_err) {
        /* ignore */
      }
    };
    load();
  }, []);

  return (
    <div className={styles.page}>
      <PageHead title="Privacy Policy" />
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
      </main>
      <Footer />
    </div>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
