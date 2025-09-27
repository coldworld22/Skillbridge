import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const moduleDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const sanitizeSlug = (value) => value.replace(/\.md$/, '').replace(/[^a-zA-Z0-9-_]/g, '');

const resolveDocLink = (href) => {
  if (!href) {
    return href;
  }

  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
    return href;
  }

  const cleaned = href.replace(/^\.\//, '').replace(/^docs\//, '');

  if (cleaned.endsWith('.md')) {
    return `/docs/${cleaned.replace(/\.md$/, '')}`;
  }

  if (cleaned.startsWith('/')) {
    return cleaned;
  }

  return `/docs/${cleaned}`;
};

const DOCS_DIR_CANDIDATES = [
  path.join(process.cwd(), 'docs'),
  path.join(process.cwd(), '..', 'docs'),
  path.join(process.cwd(), '..', '..', 'docs'),
  path.resolve(moduleDir, '../../docs'),
  path.resolve(moduleDir, '../../../docs'),
];

async function resolveDocsDirectory() {
  for (const candidate of DOCS_DIR_CANDIDATES) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isDirectory()) {
        return candidate;
      }
    } catch (error) {
      // Ignore missing paths and keep checking candidates.
    }
  }

  return null;
}

export async function getStaticPaths() {
  const docsDir = await resolveDocsDirectory();
  let entries = [];
  if (!docsDir) {
    console.warn('Documentation directory not found while generating static paths.');
  } else {
    try {
      entries = await fs.readdir(docsDir, { withFileTypes: true });
    } catch (error) {
      console.error('Failed to read docs directory:', error);
    }
  }

  const paths = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => ({
      params: { slug: entry.name.replace(/\.md$/, '') },
    }));

  return {
    paths,
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const docsDir = await resolveDocsDirectory();
  if (!docsDir) {
    console.error('Documentation directory not available while generating static props.');
    return {
      notFound: true,
    };
  }

  const slug = sanitizeSlug(params.slug);
  const targetPath = path.join(docsDir, `${slug}.md`);

  try {
    const content = await fs.readFile(targetPath, 'utf8');
    const stats = await fs.stat(targetPath);
    const match = content.match(/^#\s+(.+)/m);
    const title = match ? match[1].trim() : slug.replace(/[-_]/g, ' ');

    return {
      props: {
        slug,
        title,
        content,
        lastUpdated: stats.mtime.toISOString(),
      },
      revalidate: 300,
    };
  } catch (error) {
    console.error(`Failed to load documentation page for slug "${slug}":`, error);
    return {
      notFound: true,
    };
  }
}
export default function DocPage({ title, content, lastUpdated }) {
  const formattedUpdated = lastUpdated
    ? new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(lastUpdated))
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>{`${title} | SkillBridge Documentation`}</title>
      </Head>
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-8 sm:p-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-yellow-500">
                Documentation
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {title}
              </h1>
              {formattedUpdated && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Last updated {formattedUpdated}
                </p>
              )}
            </div>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 self-start rounded-full border border-yellow-500 px-4 py-2 text-sm font-medium text-yellow-600 transition hover:bg-yellow-500 hover:text-white"
            >
              ← Back to docs
            </Link>
          </div>

          <div className="docs-content mt-10 text-base leading-7 text-gray-700 dark:text-gray-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a({ href, children, ...props }) {
                  const resolved = resolveDocLink(href);

                  if (!resolved) {
                    return <span {...props}>{children}</span>;
                  }

                  if (resolved.startsWith('/docs/')) {
                    return (
                      <Link href={resolved} {...props} className="docs-link">
                        {children}
                      </Link>
                    );
                  }

                  if (resolved.startsWith('/')) {
                    return (
                      <Link href={resolved} {...props} className="docs-link">
                        {children}
                      </Link>
                    );
                  }

                  return (
                    <a
                      href={resolved}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                      className="docs-link"
                    >
                      {children}
                    </a>
                  );
                },
                table({ children }) {
                  return (
                    <div className="docs-table-wrapper">
                      <table>{children}</table>
                    </div>
                  );
                },
                img({ alt, src, ...props }) {
                  if (!src) {
                    return null;
                  }
                  return (
                    <img
                      src={src}
                      alt={alt}
                      {...props}
                      className="docs-image"
                    />
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
