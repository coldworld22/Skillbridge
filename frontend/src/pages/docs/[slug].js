import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import Head from 'next/head';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'isomorphic-dompurify';
import cheerio from 'cheerio';

const moduleDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const sanitizeSlug = (value) => value.replace(/\.md$/, '').replace(/[^a-zA-Z0-9-_]/g, '');

const resolveDocLink = (href) => {
  if (!href) {
    return href;
  }

  if (href.startsWith('#') || href.startsWith('?')) {
    return href;
  }

  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
    return href;
  }

  const cleaned = href.replace(/^\.\//, '').replace(/^docs\//, '');

  if (cleaned.endsWith('.md') || cleaned.endsWith('.html')) {
    return `/docs/${cleaned.replace(/\.(md|html)$/, '')}`;
  }

  if (cleaned.startsWith('/')) {
    return cleaned;
  }

  return `/docs/${cleaned}`;
};

const DOCS_DIR_CANDIDATES = [
  path.join(process.cwd(), 'public', 'docs'),
  path.resolve(moduleDir, '../../../public/docs'),
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

  const slugs = new Set();
  entries
    .filter((entry) => entry.isFile() && (/\.md$/i.test(entry.name) || /\.html$/i.test(entry.name)))
    .forEach((entry) => {
      slugs.add(entry.name.replace(/\.(md|html)$/i, ''));
    });

  const paths = Array.from(slugs).map((slug) => ({
    params: { slug },
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
  const markdownPath = path.join(docsDir, `${slug}.md`);
  const htmlPath = path.join(docsDir, `${slug}.html`);

  try {
    const content = await fs.readFile(markdownPath, 'utf8');
    const stats = await fs.stat(markdownPath);
    const match = content.match(/^#\s+(.+)/m);
    const title = match ? match[1].trim() : slug.replace(/[-_]/g, ' ');

    return {
      props: {
        slug,
        title,
        content,
        lastUpdated: stats.mtime.toISOString(),
        format: 'md',
      },
      revalidate: 300,
    };
  } catch (error) {
    console.warn(`Markdown version for slug "${slug}" not found:`, error);
  }

  try {
    const content = await fs.readFile(htmlPath, 'utf8');
    const stats = await fs.stat(htmlPath);
    const $ = cheerio.load(content);
    const title = $('h1').first().text().trim() || slug.replace(/[-_]/g, ' ');

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      const resolved = resolveDocLink(href);
      if (!resolved) {
        return;
      }

      $(element).attr('href', resolved);

      if (resolved.startsWith('/docs/') || resolved.startsWith('/')) {
        $(element).removeAttr('target');
        $(element).removeAttr('rel');
      } else {
        $(element).attr('target', '_blank');
        $(element).attr('rel', 'noopener noreferrer');
      }
    });

    const normalizedHtml = $('body').length
      ? $('body').html() || ''
      : $.root()
          .children()
          .toArray()
          .map((element) => $.html(element))
          .join('');

    return {
      props: {
        slug,
        title,
        content: normalizedHtml || '',
        lastUpdated: stats.mtime.toISOString(),
        format: 'html',
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
export default function DocPage({ title, content, lastUpdated, format }) {
  const formattedUpdated = lastUpdated
    ? new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(lastUpdated))
    : null;

  const sanitizedHtml = useMemo(() => {
    if (format !== 'html' || !content) {
      return null;
    }

    return DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });
  }, [content, format]);

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
            {format === 'html' ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizedHtml || '' }} />
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
