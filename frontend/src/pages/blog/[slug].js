import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { fetchBlogPost } from '@/services/blogService';
import DOMPurify from 'isomorphic-dompurify';

export default function BlogPostPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState(null);

  useEffect(() => {
    if (slug) {
      fetchBlogPost(slug)
        .then(setPost)
        .catch((err) => console.error('Failed to load post', err));
    }
  }, [slug]);

  return (
    <>
      <PageHead title={post ? post.title : 'Blog'} />
      <div className="bg-gray-900 text-white min-h-screen">
        <Navbar />
        {post ? (
          <article className="max-w-3xl mx-auto px-6 py-24">
            <h1 className="text-4xl font-bold text-yellow-400 mb-4">{post.title}</h1>
            {post.published_at && (
              <p className="text-sm text-gray-400 mb-6">
                {new Date(post.published_at).toLocaleDateString()}
              </p>
            )}
            {post.image && (
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-auto rounded mb-6"
              />
            )}
            {/* Sanitize HTML to prevent XSS. Ensure server-side sanitization when saving posts. */}
            <div
              className="prose prose-invert max-w-none text-white"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(post.content || ''),
              }}
            />
          </article>
        ) : (
          <div className="flex items-center justify-center py-24">
            <p>Loading...</p>
          </div>
        )}
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
