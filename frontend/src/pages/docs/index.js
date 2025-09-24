import fs from 'fs';
import path from 'path';
import { useMemo, useState } from 'react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function buildSections(rawContent) {
  if (!rawContent) {
    return [];
  }

  const lines = rawContent.split('\n');
  const sections = [];

  let current = {
    id: 'overview',
    title: 'Overview',
    content: [],
  };

  const pushCurrent = () => {
    if (!current) {
      return;
    }

    const body = current.content.join('\n').trim();
    if (body) {
      sections.push({ ...current, body });
    }
  };

  lines.forEach((line) => {
    const sectionMatch = line.match(/^##\s+(.+)/);
    if (sectionMatch) {
      pushCurrent();
      current = {
        id: slugify(sectionMatch[1].trim()),
        title: sectionMatch[1].trim(),
        content: [],
      };
      return;
    }

    if (!current) {
      return;
    }

    current.content.push(line);
  });

  pushCurrent();

  return sections;
}

export default function DocumentationLandingPage({ sections, lastUpdated }) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? null);
  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) ?? sections[0] ?? null,
    [activeSectionId, sections],
  );

  const formattedUpdated = useMemo(() => {
    if (!lastUpdated) {
      return null;
    }

    try {
      return new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(lastUpdated));
    } catch (error) {
      console.warn('Failed to format installation last updated timestamp:', error);
      return null;
    }
  }, [lastUpdated]);

  return (
    <>
      <PageHead title="Documentation" description="SkillBridge product documentation" />
      <Navbar />

      <section className="bg-gradient-to-r from-indigo-900 via-purple-900 to-black text-white py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">SkillBridge Documentation</h1>
          <p className="text-lg text-indigo-100">
            Browse setup guides, deployment notes, API references, and workflow walkthroughs for the entire SkillBridge platform.
          </p>
        </div>
      </section>

      <section className="bg-black py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-10 lg:flex-row">
            <aside className="lg:w-72">
              <div className="sticky top-28 space-y-4 rounded-2xl border border-indigo-500/40 bg-gray-900/70 p-6 shadow-xl backdrop-blur">
                <h2 className="text-lg font-semibold text-white">Installation Sections</h2>
                <p className="text-sm text-indigo-200">
                  Choose a topic to see the installation script instructions tailored for that step.
                </p>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSectionId(section.id)}
                      className={`w-full rounded-xl border px-4 py-2 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                        activeSection?.id === section.id
                          ? 'border-indigo-400 bg-indigo-600 text-white shadow-lg'
                          : 'border-gray-700 bg-gray-900 text-indigo-100 hover:border-indigo-400 hover:bg-gray-800'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
                {formattedUpdated && (
                  <p className="text-xs text-indigo-200/80">Last updated {formattedUpdated}</p>
                )}
              </div>
            </aside>

            <div className="flex-1">
              {activeSection ? (
                <div className="rounded-3xl border border-indigo-500/30 bg-gray-900/50 p-6 shadow-2xl backdrop-blur">
                  <h2 className="text-2xl font-semibold text-white">{activeSection.title}</h2>
                  <div className="mt-6 text-indigo-100">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a({ href, children, ...props }) {
                          if (!href) {
                            return <span {...props}>{children}</span>;
                          }

                          const isExternal = href.startsWith('http://') || href.startsWith('https://');

                          if (isExternal) {
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-300 underline hover:text-indigo-200"
                                {...props}
                              >
                                {children}
                              </a>
                            );
                          }

                          return (
                            <a href={href} className="text-indigo-300 underline hover:text-indigo-200" {...props}>
                              {children}
                            </a>
                          );
                        },
                        code({ inline, className, children, ...props }) {
                          if (inline) {
                            return (
                              <code className="rounded bg-gray-800 px-1 py-0.5 text-xs text-indigo-200" {...props}>
                                {children}
                              </code>
                            );
                          }

                          return (
                            <pre className="my-4 overflow-x-auto rounded-2xl border border-gray-800 bg-black/60 p-4 text-sm text-indigo-100">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          );
                        },
                        p({ children, ...props }) {
                          return (
                            <p className="mb-4 leading-relaxed" {...props}>
                              {children}
                            </p>
                          );
                        },
                        ul({ children, ...props }) {
                          return (
                            <ul className="mb-4 list-disc space-y-2 pl-6 marker:text-indigo-300" {...props}>
                              {children}
                            </ul>
                          );
                        },
                        ol({ children, ...props }) {
                          return (
                            <ol className="mb-4 list-decimal space-y-2 pl-6 marker:text-indigo-300" {...props}>
                              {children}
                            </ol>
                          );
                        },
                        li({ children, ...props }) {
                          return (
                            <li className="leading-relaxed" {...props}>
                              {children}
                            </li>
                          );
                        },
                        h3({ children, ...props }) {
                          return (
                            <h3 className="mt-6 text-xl font-semibold text-white" {...props}>
                              {children}
                            </h3>
                          );
                        },
                        table({ children, ...props }) {
                          return (
                            <div className="my-6 overflow-x-auto rounded-2xl border border-gray-800 bg-black/50" {...props}>
                              <table className="min-w-full divide-y divide-gray-800 text-left text-sm text-indigo-100">
                                {children}
                              </table>
                            </div>
                          );
                        },
                      }}
                    >
                      {activeSection.body}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-indigo-500/30 bg-gray-900/40 p-6 text-center text-indigo-100">
                  Installation content is currently unavailable. Check back soon for scripted setup guidance.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-indigo-700 text-white py-16 text-center px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold mb-4">Need more help?</h2>
          <p className="text-indigo-100 mb-6">
            Join the community discussions, open an issue on GitHub, or reach out to the SkillBridge team for tailored support.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://github.com/eduskillbridge/SkillBridge/discussions"
              className="bg-white text-indigo-700 px-6 py-2 rounded shadow hover:bg-gray-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              Community Support
            </a>
            <a
              href="https://github.com/eduskillbridge/SkillBridge/issues/new/choose"
              className="border border-white px-6 py-2 rounded hover:bg-white hover:text-indigo-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Report an Issue
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

function resolveDocsDirectory() {
  const candidatePaths = [
    path.join(process.cwd(), 'docs'),
    path.join(process.cwd(), '..', 'docs'),
    path.join(process.cwd(), '..', '..', 'docs'),
  ];

  return candidatePaths.find((candidate) => fs.existsSync(candidate)) || null;
}

export async function getStaticProps({ locale }) {
  const docsDir = resolveDocsDirectory();
  let sections = [];
  let lastUpdated = null;

  if (docsDir) {
    const installationPath = path.join(docsDir, 'installation.md');

    try {
      const installationContent = fs.readFileSync(installationPath, 'utf8');
      sections = buildSections(installationContent);

      const stats = fs.statSync(installationPath);
      lastUpdated = stats.mtime.toISOString();
    } catch (error) {
      console.error('Failed to load installation documentation for docs landing page:', error);
    }
  }

  return {
    props: {
      sections,
      lastUpdated,
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
