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

const extractSummary = (content) => {
  const normalized = content.replace(/\r/g, '').split('\n');
  const paragraph = normalized.find(
    (line) =>
      line.trim() &&
      !line.trim().startsWith('#') &&
      !line.trim().startsWith('- ') &&
      !line.trim().startsWith('* ') &&
      !line.trim().startsWith('>'),
  );
  return paragraph ? paragraph.trim() : '';
};

const readDocsIndex = async () => {
  const files = await fs.readdir(DOCS_DIR);
  const entries = files.filter((file) => file.endsWith('.md') && file !== 'README.md');

  const docs = await Promise.all(
    entries.map(async (file) => {
      const filePath = path.join(DOCS_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      const slug = file.replace(/\.md$/, '');
      return {
        slug,
        title: extractTitle(content, slug.replace(/-/g, ' ')),
        summary: extractSummary(content),
      };
    }),
  );

  docs.sort((a, b) => a.title.localeCompare(b.title));
  return docs;
};

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

export default function DocsIndexPage({ readme, docs }) {
  return (
    <>
      <PageHead title="Documentation" />
      <div className="bg-gray-900 text-white min-h-screen">
        <Navbar />
        <main className="max-w-5xl mx-auto px-6 py-16">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-yellow-400 mb-4">SkillBridge Documentation</h1>
            <p className="text-lg text-gray-300">
              Explore setup guides, workflows, and reference material for the SkillBridge platform.
            </p>
          </header>
          <article className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {readme}
            </ReactMarkdown>
          </article>
          {docs.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-semibold mb-6">All guides</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {docs.map((doc) => (
                  <Link
                    key={doc.slug}
                    href={`/docs/${doc.slug}`}
                    className="block bg-gray-800 border border-gray-700 hover:border-yellow-400 transition rounded-lg p-6"
                  >
                    <h3 className="text-xl font-semibold text-yellow-300 mb-2">{doc.title}</h3>
                    <p className="text-gray-300 text-sm">
                      {doc.summary || `Read the ${doc.title} guide.`}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}

export async function getStaticProps({ locale }) {
  try {
    const readmePath = path.join(DOCS_DIR, 'README.md');
    const readme = await fs.readFile(readmePath, 'utf8');
    const docs = await readDocsIndex();

    return {
      props: {
        readme,
        docs,
        ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Failed to load documentation index:', error);
    return {
      notFound: true,
    };
  }
}
