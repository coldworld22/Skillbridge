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
      // Ignore missing paths and continue.
    }
  }

  return null;
}

function extractTitleFromContent(content, fallback) {
  const match = content.match(/^#\s+(.+)/m);
  if (match) {
    return match[1].trim();
  }

  return fallback;
}

function extractSummaryFromContent(content) {
  const sanitized = content.replace(/\r\n/g, '\n');
  const lines = sanitized.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith('#')) {
      continue;
    }

    return trimmed.replace(/[`*_]+/g, '');
  }

  return '';
}

export default function DocumentationLandingPage({ docs }) {
  return (
    <>
      <PageHead
        title="Documentation"
        description="Browse the SkillBridge knowledge base compiled from the project's Markdown guides."
      />
      <Navbar />

      <section className="bg-gradient-to-r from-indigo-900 via-purple-900 to-black text-white py-24 px-6 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold md:text-5xl">SkillBridge Documentation</h1>
          <p className="text-lg text-indigo-100">
            Explore detailed guides, walkthroughs, and references sourced directly from the Markdown files in the
            repository.
          </p>
        </div>
      </section>

      <section className="bg-black py-16 px-6 text-white">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-semibold">All guides</h2>
            <p className="text-gray-300">
              Select a guide below to view the full content. New Markdown files added to the project automatically appear
              here.
            </p>
          </div>

          {docs.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-8 text-center text-gray-300">
              No documentation files were found. Add Markdown files to the <code>docs/</code> directory to populate this
              page.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {docs.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/docs/${doc.slug}`}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-gray-800 bg-gray-900/60 p-6 transition hover:border-indigo-400 hover:bg-gray-900"
                >
                  <div className="space-y-4">
                    <div className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
                      Markdown guide
                    </div>
                    <h3 className="text-2xl font-semibold text-white transition group-hover:text-indigo-200">{doc.title}</h3>
                    {doc.summary && <p className="text-sm text-gray-300">{doc.summary}</p>}
                  </div>
                  <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
                    <span>Last updated {doc.lastUpdated}</span>
                    <span className="inline-flex items-center gap-1 text-indigo-300 group-hover:text-indigo-200">
                      Read guide
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

export async function getStaticProps({ locale }) {
  const docsDir = await resolveDocsDirectory();
  let docs = [];

  if (docsDir) {
    try {
      const entries = await fs.readdir(docsDir, { withFileTypes: true });
      const markdownFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));

      docs = await Promise.all(
        markdownFiles.map(async (entry) => {
          const slug = entry.name.replace(/\.md$/, '');
          const filePath = path.join(docsDir, entry.name);
          const content = await fs.readFile(filePath, 'utf8');
          const stats = await fs.stat(filePath);
          const title = extractTitleFromContent(content, slug.replace(/[-_]/g, ' '));
          const summary = extractSummaryFromContent(content);
          const lastUpdated = new Intl.DateTimeFormat('en', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }).format(stats.mtime);

          return {
            slug,
            title,
            summary,
            lastUpdated,
          };
        }),
      );

      docs.sort((a, b) => a.title.localeCompare(b.title));
    } catch (error) {
      console.error('Failed to load documentation index:', error);
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
