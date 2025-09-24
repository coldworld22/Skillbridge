import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';
const DOCS_DIR = path.resolve(process.cwd(), '../docs');

const titleFromContent = (content, fallback) => {
  const match = content.match(/^#\s+(.+)/m);
  if (match) {
    return match[1].trim();
  }
  return fallback;
};

export async function getStaticProps() {
  let entries;
  try {
    entries = await fs.readdir(DOCS_DIR, { withFileTypes: true });
  } catch (error) {
    console.error('Failed to read docs directory:', error);
    return { props: { docs: [] } };
  }

  const docs = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map(async (entry) => {
        const filePath = path.join(DOCS_DIR, entry.name);
        const content = await fs.readFile(filePath, 'utf8');
        const slug = entry.name.replace(/\.md$/, '');
        const title = titleFromContent(
          content,
          slug
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase()),
        );
        return { slug, title };
      }),
  );

  docs.sort((a, b) => a.title.localeCompare(b.title));

  return {
    props: {
      docs,
    },
  };
}

export default function DocsIndex({ docs }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-8 sm:p-12">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-yellow-500">
              SkillBridge Documentation
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Explore the platform guides
            </h1>
            <p className="mt-4 text-base text-gray-600 dark:text-gray-300">
              Browse the curated guides and reference material for installing, configuring and using SkillBridge.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {docs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className="group block rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-5 transition hover:border-yellow-500 hover:bg-white dark:hover:border-yellow-500 dark:hover:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400">
                    {doc.title}
                  </h2>
                  <span className="mt-1 inline-flex items-center justify-center rounded-full border border-current px-2.5 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                    View
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Read the full guide
                </p>
              </Link>
            ))}
            {docs.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Documentation files were not found. Please ensure the <code>docs/</code> folder is available at build time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
