import { useMemo, useState } from 'react';
import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import Footer from '@/components/website/sections/Footer';
import Navbar from '@/components/website/sections/Navbar';
import PageHead from '@/components/common/PageHead';
import nextI18NextConfig from '../../../next-i18next.config.js';

const DOCS_DIR_CANDIDATES = [
  path.join(process.cwd(), 'docs'),
  path.join(process.cwd(), '..', 'docs'),
  path.join(process.cwd(), '..', '..', 'docs'),
];

async function resolveDocsDirectory() {
  for (const candidate of DOCS_DIR_CANDIDATES) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isDirectory()) {
        return candidate;
      }
    } catch (error) {
      // Ignore missing directories and continue checking.
    }
  }

  return null;
}

function extractMetadata(content, slug) {
  const normalized = content.replace(/\r\n/g, '\n');
  const titleMatch = normalized.match(/^#\s+(.+)/m);
  const fallbackTitle = slug.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  const title = titleMatch ? titleMatch[1].trim() : fallbackTitle || slug;

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter((line) =>
      line &&
      !line.startsWith('#') &&
      !line.startsWith('![') &&
      !line.startsWith('|') &&
      !/^[-*]\s/.test(line) &&
      !line.startsWith('<') &&
      !line.startsWith('```'),
    );

  const descriptionSource = lines[0] || '';
  const description = descriptionSource
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title,
    description,
  };
}

async function loadDocsMetadata() {
  const docsDir = await resolveDocsDirectory();
  if (!docsDir) {
    return [];
  }

  let entries = [];
  try {
    entries = await fs.readdir(docsDir, { withFileTypes: true });
  } catch (error) {
    console.error('Unable to read documentation directory:', error);
    return [];
  }

  const docs = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue;
    }

    const slug = entry.name.replace(/\.md$/, '');
    const filePath = path.join(docsDir, entry.name);

    try {
      const [content, stats] = await Promise.all([
        fs.readFile(filePath, 'utf8'),
        fs.stat(filePath),
      ]);
      const { title, description } = extractMetadata(content, slug);

      docs.push({
        slug,
        title,
        description,
        lastUpdated: stats.mtime.toISOString(),
      });
    } catch (error) {
      console.error(`Failed to load documentation file "${entry.name}":`, error);
    }
  }

  return docs.sort((a, b) => a.title.localeCompare(b.title));
}

function formatDate(value) {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch (error) {
    return null;
  }
}

export default function DocumentationLandingPage({ docs = [] }) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredDocs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return docs;
    }

    return docs.filter((doc) => {
      const haystack = `${doc.title} ${doc.slug} ${doc.description}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [docs, query]);

  const visibleDocs = showAll ? filteredDocs : filteredDocs.slice(0, 12);

  return (
    <>
      <PageHead title="Documentation" description="Explore the latest SkillBridge guides and references." />
      <Navbar />

      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-black text-white py-24 px-6 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold md:text-5xl">SkillBridge Documentation</h1>
          <p className="text-lg text-indigo-100">
            Browse every guide shipped with the repository. These pages are generated directly from the Markdown files in the
            <code className="mx-1 rounded bg-white/10 px-2 py-1 text-sm text-indigo-100">/docs</code> directory so you are always
            reading the latest version.
          </p>
        </div>
      </section>

      <section className="bg-black py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">All guides ({filteredDocs.length})</h2>
              <p className="mt-2 max-w-2xl text-gray-300">
                Use the search below to quickly jump to install instructions, API references, deployment tips, and more.
              </p>
            </div>
            <div className="w-full md:w-80">
              <label htmlFor="docs-search" className="sr-only">
                Search documentation
              </label>
              <input
                id="docs-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search guides"
                className="w-full rounded-xl border border-indigo-500/40 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-indigo-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/80"
              />
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-indigo-500/40 bg-slate-950/60 p-12 text-center text-gray-300">
              <h3 className="text-xl font-semibold text-white">No matches found</h3>
              <p className="mt-3 text-sm text-gray-400">
                We couldn't find any documentation matching "{query}". Try a different keyword or clear the search box.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {visibleDocs.map((doc) => {
                  const formattedDate = formatDate(doc.lastUpdated);

                  return (
                    <Link
                      key={doc.slug}
                      href={`/docs/${doc.slug}`}
                      className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-lg transition hover:border-indigo-500/60 hover:shadow-indigo-500/20"
                    >
                      <div className="flex-1 space-y-3">
                        <span className="inline-flex items-center rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
                          Guide
                        </span>
                        <h3 className="text-xl font-semibold text-white transition group-hover:text-indigo-200">
                          {doc.title}
                        </h3>
                        {doc.description ? (
                          <p className="text-sm leading-6 text-gray-300 line-clamp-4">{doc.description}</p>
                        ) : (
                          <p className="text-sm text-gray-500">Open to read the full guide.</p>
                        )}
                      </div>

                      {formattedDate && (
                        <div className="mt-6 flex items-center justify-between text-xs text-indigo-200/80">
                          <span>Last updated</span>
                          <span>{formattedDate}</span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>

              {filteredDocs.length > visibleDocs.length && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-500/60 bg-indigo-500/10 px-6 py-3 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/20"
                  >
                    Show all {filteredDocs.length} guides
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="bg-indigo-700 text-white py-16 text-center px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-semibold mb-4">Need more help?</h2>
          <p className="text-indigo-100 mb-6">
            Join the community discussions or open an issue if you run into trouble during installation or customization.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://github.com/eduskillbridge/SkillBridge/discussions"
              className="border border-white px-6 py-2 rounded hover:bg-white hover:text-indigo-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Community Support
            </a>
            <a
              href="https://github.com/eduskillbridge/SkillBridge/issues/new/choose"
              className="bg-white text-indigo-700 px-6 py-2 rounded shadow hover:bg-gray-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open an issue
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export async function getStaticProps({ locale }) {
  const docs = await loadDocsMetadata();

  return {
    props: {
      docs,
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
    revalidate: 300,
  };
}
