import fs from 'fs/promises';
import path from 'path';
import { useMemo, useState } from 'react';
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
      // Ignore and continue searching.
    }
  }

  return null;
}

function extractSummary(content) {
  if (!content) {
    return '';
  }

  const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');
  const withoutHeading = withoutCodeBlocks.replace(/^#\s+.*$/m, '');
  const paragraphs = withoutHeading
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return '';
  }

  const summary = paragraphs[0];
  return summary.length > 220 ? `${summary.slice(0, 217).trimEnd()}…` : summary;
}

export default function DocumentationLandingPage({ docs = [] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocs = useMemo(() => {
    if (!searchTerm) {
      return docs;
    }

    const normalized = searchTerm.toLowerCase();
    return docs.filter((doc) => {
      return (
        doc.title.toLowerCase().includes(normalized) ||
        (doc.summary && doc.summary.toLowerCase().includes(normalized))
      );
    });
  }, [docs, searchTerm]);

  return (
    <>
      <PageHead
        title="Documentation"
        description="Browse SkillBridge guides, references, and workflows sourced directly from the Markdown docs."
      />
      <Navbar />

      <main className="bg-gray-50 dark:bg-gray-950">
        <section className="bg-gradient-to-r from-indigo-900 via-purple-900 to-black text-white py-24 px-6 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-4xl font-bold md:text-5xl">SkillBridge Documentation</h1>
            <p className="text-lg text-indigo-100">
              All of the guides below are rendered straight from the Markdown files that live in the repository.
              Search by keyword or jump into any topic to view the full document.
            </p>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Browse all documents</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                The list updates automatically whenever Markdown files are added or edited in the <code>docs/</code>{' '}
                directory.
              </p>
            </div>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <label htmlFor="docs-search" className="sr-only">
                Search documentation
              </label>
              <div className="relative w-full sm:max-w-md">
                <input
                  id="docs-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by title or summary..."
                  className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-base text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <svg
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredDocs.length} of {docs.length} documents
              </p>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">No matching docs</h3>
                <p className="mt-3 text-gray-600 dark:text-gray-400">
                  Try a different keyword or clear the search box to see every available guide.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredDocs.map((doc) => {
                  const formattedDate = doc.lastUpdated
                    ? new Intl.DateTimeFormat('en', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }).format(new Date(doc.lastUpdated))
                    : null;

                  return (
                    <Link
                      key={doc.slug}
                      href={`/docs/${doc.slug}`}
                      className="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Guide</p>
                        <h3 className="mt-2 text-2xl font-semibold text-gray-900 transition group-hover:text-indigo-600 dark:text-gray-100 dark:group-hover:text-indigo-400">
                          {doc.title}
                        </h3>
                        {doc.summary && (
                          <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{doc.summary}</p>
                        )}
                      </div>
                      <div className="mt-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1 text-indigo-500 group-hover:text-indigo-600 dark:text-indigo-400 dark:group-hover:text-indigo-300">
                          Read doc
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4-4 4M3 12h18" />
                          </svg>
                        </span>
                        {formattedDate && <span>Updated {formattedDate}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export async function getStaticProps({ locale }) {
  const docsDir = await resolveDocsDirectory();
  let docs = [];

  if (!docsDir) {
    console.error('Documentation directory not found while generating docs index.');
  } else {
    try {
      const entries = await fs.readdir(docsDir, { withFileTypes: true });
      const markdownFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));

      docs = await Promise.all(
        markdownFiles.map(async (entry) => {
          const slug = entry.name.replace(/\.md$/, '');
          const targetPath = path.join(docsDir, entry.name);
          const [content, stats] = await Promise.all([
            fs.readFile(targetPath, 'utf8'),
            fs.stat(targetPath),
          ]);

          const titleMatch = content.match(/^#\s+(.+)/m);
          const title = titleMatch ? titleMatch[1].trim() : slug.replace(/[-_]/g, ' ');

          return {
            slug,
            title,
            summary: extractSummary(content),
            lastUpdated: stats.mtime.toISOString(),
          };
        }),
      );

      docs.sort((a, b) => a.title.localeCompare(b.title));
    } catch (error) {
      console.error('Failed to read docs directory while generating docs index:', error);
    }
  }

  return {
    props: {
      docs,
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
    revalidate: 300,
  };
}
