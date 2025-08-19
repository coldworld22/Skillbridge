import { useState } from 'react';
import useSWR from 'swr';
import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import api from '@/services/api/api';
import { useTranslation } from 'next-i18next';

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

      <div className="bg-gray-900 min-h-screen text-white">
        <Navbar />

        <header className="text-center py-24 px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-500 mb-4">{t('faqs')}</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to know before getting started with SkillBridge.
          </p>
        </header>

        <section className="bg-black py-16 px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="border border-gray-700 rounded-lg transition-all duration-300 overflow-hidden"
                >
                  <button
                    onClick={() => toggle(index)}
                    className="w-full flex justify-between items-center text-left p-5 text-lg font-semibold focus:outline-none hover:bg-gray-800 transition"
                  >
                    {faq.question}
                    {isOpen ? (
                      <FaChevronUp className="text-yellow-400" />
                    ) : (
                      <FaChevronDown className="text-yellow-400" />
                    )}
                  </button>
                  <div
                    className={`px-5 pb-5 text-gray-300 transition-all duration-300 ${
                      isOpen ? 'block' : 'hidden'
                    }`}
                  >
                    {faq.answer}
                  </div>
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
