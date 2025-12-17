import { useState } from 'react';
import useSWR from 'swr';
import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import api from '@/services/api/api';
import { useTranslation } from 'next-i18next';
import styles from './faqs.module.scss';

const fetcher = (url) => api.get(url).then((res) => res.data.data);

export default function FaqPage() {
  const { t } = useTranslation('common');
  const { data: faqs = [] } = useSWR('/faqs', fetcher);
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <PageHead title={t('faqs')} />

      <div className={styles.page}>
        <Navbar />

        <header className={styles.hero}>
          <h1 className={styles.title}>{t('faqs')}</h1>
          <p className={styles.subtitle}>
            Everything you need to know before getting started with SkillBridge.
          </p>
        </header>

        <section className={styles.section}>
          <div className={styles.container}>
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className={styles.card}
                >
                  <button
                    onClick={() => toggle(index)}
                    className={styles.question}
                  >
                    {faq.question}
                    {isOpen ? (
                      <FaChevronUp className={styles.icon} />
                    ) : (
                      <FaChevronDown className={styles.icon} />
                    )}
                  </button>
                  {isOpen && <div className={styles.answer}>{faq.answer}</div>}
                </div>
              );
            })}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
