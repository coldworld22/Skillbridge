import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchBlogPosts } from '@/services/blogService';
import { useTranslation } from 'next-i18next';

export default function BlogPage() {
  const { t } = useTranslation('website');
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchBlogPosts();
        setPosts(list);
      } catch (err) {
        console.error('Failed to load posts', err);
      }
    };
    load();
  }, []);
  return (
    <>
      <PageHead title={t('blogPage.title')} />

      <div className="bg-gray-900 text-white min-h-screen">
        <Navbar />

        <section className="py-24 px-6 text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">{t('blogPage.heading')}</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">{t('blogPage.description')}</p>
        </section>

        <section className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-10 px-6 pb-24">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-yellow-400/20 transition">
              {post.image && (
                <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-yellow-300">{post.title}</h2>
                {post.published_at && (
                  <p className="text-sm text-gray-400 mt-1">{new Date(post.published_at).toLocaleDateString()}</p>
                )}
                <p className="text-gray-300 mt-3">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`}>
                  <span className="text-indigo-400 hover:underline mt-4 inline-block">{t('blogPage.read_more')}</span>
                </Link>
              </div>
            </div>
          ))}
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
      ...(await serverSideTranslations(locale, ['common', 'website'], nextI18NextConfig)),
    },
  };
}
