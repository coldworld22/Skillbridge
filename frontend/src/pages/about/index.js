import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { useTranslation } from 'next-i18next';

export default function AboutUsPage() {
  const { t } = useTranslation('website');
  const features = [
    {
      icon: '🎓',
      title: t('aboutPage.features.online_classes'),
      desc: t('aboutPage.features.online_classes_desc'),
    },
    {
      icon: '🤖',
      title: t('aboutPage.features.ai_tutoring'),
      desc: t('aboutPage.features.ai_tutoring_desc'),
    },
    {
      icon: '💬',
      title: t('aboutPage.features.community'),
      desc: t('aboutPage.features.community_desc'),
    },
    {
      icon: '📈',
      title: t('aboutPage.features.instructor_tools'),
      desc: t('aboutPage.features.instructor_tools_desc'),
    },
    {
      icon: '📜',
      title: t('aboutPage.features.certificates'),
      desc: t('aboutPage.features.certificates_desc'),
    },
    {
      icon: '🔐',
      title: t('aboutPage.features.flexible_plans'),
      desc: t('aboutPage.features.flexible_plans_desc'),
    },
  ];

  return (
    <>
      <PageHead title={t('aboutPage.title')} />
      <Navbar />
      <section className="bg-black text-white text-center py-24">
        <h1 className="text-4xl font-bold mb-4">{t('aboutPage.hero_heading')}</h1>
        <p className="text-lg max-w-2xl mx-auto text-yellow-300">
          {t('aboutPage.hero_description')}
        </p>
      </section>

      <section className="bg-gray-900 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-semibold mb-6">{t('aboutPage.mission_heading')}</h2>
        <p className="text-lg max-w-3xl mx-auto text-yellow-300">
          {t('aboutPage.mission_description')}
        </p>
      </section>

      <section className="bg-black py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-10 text-center px-6">
          {features.map((item, i) => (
            <div key={i} className="bg-gray-800 rounded-xl shadow p-6 hover:shadow-lg transition text-white">
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-indigo-700 text-white py-16 text-center">
        <h2 className="text-3xl font-semibold mb-4">{t('aboutPage.join_heading')}</h2>
        <p className="mb-6 text-gray-200">{t('aboutPage.join_description')}</p>
        <div className="space-x-4">
          <a href="/register" className="bg-white text-indigo-700 px-6 py-2 rounded shadow hover:bg-gray-100">
            {t('aboutPage.get_started')}
          </a>
          <a href="/contact" className="border border-white px-6 py-2 rounded hover:bg-white hover:text-indigo-700">
            {t('aboutPage.contact_us')}
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'website'], nextI18NextConfig)),
    },
  };
}
