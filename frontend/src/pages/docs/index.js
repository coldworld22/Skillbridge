import fs from 'fs';
import path from 'path';

import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';

function formatDocTitle(filename) {
  return filename
    .replace(/\.md$/i, '')
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export default function DocumentationLandingPage({ docs }) {
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
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">Documentation Library</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {docs.map((doc) => (
              <a
                key={doc.filename}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-900 hover:bg-gray-800 transition rounded-xl border border-gray-800 p-6 shadow-lg"
              >
                <h3 className="text-xl font-semibold text-white mb-2">{doc.title}</h3>
                <p className="text-sm text-gray-300">{doc.description}</p>
                <span className="mt-4 inline-flex items-center text-indigo-300 font-medium">
                  View guide
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </a>
            ))}
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

export async function getStaticProps({ locale }) {
  const docsDir = path.join(process.cwd(), '..', 'docs');
  const filenames = fs
    .readdirSync(docsDir)
    .filter((filename) => filename.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b));

  const docs = filenames.map((filename) => {
    const title = formatDocTitle(filename);

    return {
      filename,
      title,
      description: `Read the ${title} guide on GitHub.`,
      url: `https://github.com/eduskillbridge/SkillBridge/blob/main/docs/${filename}`,
    };
  });

  return {
    props: {
      docs,
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
