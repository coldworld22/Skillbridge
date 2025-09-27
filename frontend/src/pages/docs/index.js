import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'isomorphic-dompurify';
import cheerio from 'cheerio';

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import Footer from '@/components/website/sections/Footer';
import Navbar from '@/components/website/sections/Navbar';
import PageHead from '@/components/common/PageHead';
import nextI18NextConfig from '../../../next-i18next.config.js';
import { resolveDocsDirectory } from '@/utils/docsDirectory';

const moduleDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// Ensure standalone builds can still locate the project-level docs directory.
const docsDirectoryExplicitPaths = [
  path.join(process.cwd(), 'docs'),
  path.join(process.cwd(), '..', 'docs'),
  path.join(process.cwd(), '..', '..', 'docs'),
  path.join(process.cwd(), '..', '..', '..', 'docs'),
  path.resolve(moduleDir, '../../docs'),
  path.resolve(moduleDir, '../../../docs'),
  path.resolve(moduleDir, '../../../..', 'docs'),
];

function sanitizeSlug(value) {
  return value
    .replace(/\.(md|html)$/i, '')
    .split('/')
    .map((segment) => segment.replace(/[^a-zA-Z0-9-_]/g, ''))
    .filter(Boolean)
    .join('/');
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

function extractMetadataFromHtml(html, slug) {
  const $ = cheerio.load(html);
  const title = $('h1').first().text().trim() || slug.replace(/[-_]/g, ' ');

  let summary = '';
  $('p').each((_, element) => {
    if (summary) {
      return false;
    }

    const text = $(element).text().replace(/\s+/g, ' ').trim();
    if (text) {
      summary = text;
    }

    return undefined;
  });

  return {
    title,
    summary,
  };
}

function sanitizeHtmlContent(content) {
  return DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });
}

export default function DocumentationLandingPage({ docs, installationContent, installationFormat }) {
  const sanitizedInstallation = useMemo(() => {
    if (installationFormat !== 'html' || !installationContent) {
      return null;
    }

    return sanitizeHtmlContent(installationContent);
  }, [installationContent, installationFormat]);

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

      <section className="bg-gray-950 py-16 px-6 text-white">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">Start here</p>
            <h2 className="text-3xl font-semibold">Installation workflow</h2>
            <p className="text-gray-300">
              Follow the steps below to get SkillBridge up and running before diving into the rest of the documentation.
            </p>
          </div>

          {installationContent ? (
            <div className="docs-content mx-auto max-w-none space-y-6 text-left text-gray-100">
              {installationFormat === 'html' ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizedInstallation }} />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{installationContent}</ReactMarkdown>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-8 text-center text-gray-300">
              The installation guide could not be loaded. Please ensure <code>installation.md</code> or
              <code>installation.html</code> exists in the <code>docs/</code> directory.
            </div>
          )}
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

          <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-white">Getting Started</h3>
                <p className="text-gray-300">
                  Install SkillBridge from the CodeCanyon ZIP with these quick steps. The summary below mirrors the
                  installation guide so you can launch the stack without reading the entire document first.
                </p>
              </div>
              <ol className="space-y-4 text-gray-200">
                <li>
                  <span className="font-semibold text-indigo-200">1. Upload the archive.</span> Move the purchased
                  ZIP into the target directory locally or transfer it to your server with <code>scp</code> or another
                  file copy tool.
                </li>
                <li>
                  <span className="font-semibold text-indigo-200">2. Extract it to <code>Skillbridge/</code>.</span> Unzip
                  the package, ensure the project root is named <code>Skillbridge</code>, and change into that directory so
                  scripts such as <code>install.sh</code> sit at the top level.
                </li>
                <li>
                  <span className="font-semibold text-indigo-200">3. Copy the environment templates.</span> Duplicate the
                  provided <code>.env.example</code> files: <code>cp .env.example .env</code>,
                  <code>cp backend/.env.example backend/.env</code>, and the remaining frontend/backend variants that ship in
                  the archive.
                </li>
                <li>
                  <span className="font-semibold text-indigo-200">4. Run the installer.</span> From the project root,
                  execute <code>./install.sh</code> to configure dependencies, migrations, and the initial admin account.
                </li>
                <li>
                  <span className="font-semibold text-indigo-200">5. Start Docker.</span> Launch the stack with
                  <code>docker compose up --build</code> for local work or add <code>-d</code> to run in the background on a
                  server.
                </li>
              </ol>
              <div>
                <Link
                  href="/docs/installation"
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  Read the full installation guide
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
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
                      {doc.format === 'html' ? 'HTML guide' : 'Markdown guide'}
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
  const docsDir = await resolveDocsDirectory({
    moduleDirectory: moduleDir,
    explicitPaths: docsDirectoryExplicitPaths,
  });
  let docs = [];
  let installationContent = null;
  let installationFormat = null;

  if (docsDir) {
    try {
      const entries = await fs.readdir(docsDir, { withFileTypes: true });
      const docEntries = entries.filter(
        (entry) => entry.isFile() && (/\.md$/i.test(entry.name) || /\.html$/i.test(entry.name)),
      );

      const docsBySlug = new Map();
      for (const entry of docEntries) {
        const slug = sanitizeSlug(entry.name);
        if (!slug) {
          continue;
        }

        const ext = entry.name.toLowerCase().endsWith('.md') ? 'md' : 'html';
        if (!docsBySlug.has(slug)) {
          docsBySlug.set(slug, {});
        }

        docsBySlug.get(slug)[ext] = entry.name;
      }

      docs = await Promise.all(
        Array.from(docsBySlug.entries()).map(async ([slug, files]) => {
          const targetName = files.md || files.html;
          const format = files.md ? 'md' : 'html';
          const filePath = path.join(docsDir, targetName);
          const content = await fs.readFile(filePath, 'utf8');
          const stats = await fs.stat(filePath);
          const fallbackTitle = slug.replace(/[-_]/g, ' ');

          let title = fallbackTitle;
          let summary = '';

          if (format === 'md') {
            title = extractTitleFromContent(content, fallbackTitle);
            summary = extractSummaryFromContent(content);
          } else {
            const metadata = extractMetadataFromHtml(content, slug);
            title = metadata.title;
            summary = metadata.summary;
          }

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
            format,
          };
        }),
      );

      docs.sort((a, b) => a.title.localeCompare(b.title));
    } catch (error) {
      console.error('Failed to load documentation index:', error);
    }

    try {
      const installationMdPath = path.join(docsDir, 'installation.md');
      installationContent = await fs.readFile(installationMdPath, 'utf8');
      installationFormat = 'md';
    } catch (error) {
      try {
        const installationHtmlPath = path.join(docsDir, 'installation.html');
        installationContent = await fs.readFile(installationHtmlPath, 'utf8');
        installationFormat = 'html';
      } catch (htmlError) {
        console.warn('Installation guide not found or failed to load:', error, htmlError);
      }
    }
  }

  return {
    props: {
      docs,
      installationContent,
      installationFormat,
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
    revalidate: 300,
  };
}
