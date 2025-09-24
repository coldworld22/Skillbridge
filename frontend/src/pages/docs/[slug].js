import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

const DOCS_DIR = path.join(process.cwd(), 'docs');

const extractTitle = (content, fallback) => {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
};

const sanitizeSlug = (slug) => slug.replace(/[^a-zA-Z0-9-]/g, '');

const MarkdownLink = ({ href, children, ...props }) => {
  if (!href) {
    return <span {...props}>{children}</span>;
  }

  if (href.endsWith('.md')) {
    const slug = href.replace(/\.md$/, '');
    return (
      <Link href={`/docs/${slug}`} {...props}>
        {children}
      </Link>
    );
  }

  const isExternal = /^https?:\/\//i.test(href);
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
};

const markdownComponents = {
  a: MarkdownLink,
};

export default function DocumentationPage({ title, content }) {
  return (
    <>
      <PageHead title={`${title} – Documentation`} />
      <div className="bg-gray-900 text-white min-h-screen">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-16">
          <nav className="text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex gap-2 flex-wrap">
              <li>
                <Link href="/docs" className="hover:text-yellow-300">
                  Documentation
                </Link>
              </li>
              <li className="text-gray-500">/</li>
              <li className="text-gray-300">{title}</li>
            </ol>
          </nav>
          <article className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
}

export async function getStaticPaths() {
  const files = await fs.readdir(DOCS_DIR);
  const paths = files
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .map((file) => ({
      params: { slug: file.replace(/\.md$/, '') },
    }));

  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params, locale }) {
  try {
    const rawSlug = params?.slug;
    if (!rawSlug) {
      return { notFound: true };
    }

    const slug = sanitizeSlug(rawSlug);
    const filePath = path.join(DOCS_DIR, `${slug}.md`);
    const content = await fs.readFile(filePath, 'utf8');
    const title = extractTitle(content, slug.replace(/-/g, ' '));

    return {
      props: {
        title,
        content,
        ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error(`Failed to load documentation page for slug ${params?.slug}:`, error);
    return {
      notFound: true,
    };
  }
}
