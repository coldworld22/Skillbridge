import { useMemo, useState } from 'react';

import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';

const installationSections = [
  {
    id: 'overview',
    title: 'Installation overview',
    summary: 'Understand what the installer does before you run it.',
    content: [
      {
        type: 'paragraph',
        text:
          'SkillBridge ships with a unified install script that prepares configuration files, runs database migrations, and optionally seeds demo data. Use it to bootstrap both local environments and production deployments with a single command.',
      },
      {
        type: 'paragraph',
        text:
          'The script guides you through branding and admin account prompts when values are missing. For unattended runs—such as in CI pipelines—pass environment variables to skip the interactive prompts.',
      },
    ],
  },
  {
    id: 'prerequisites',
    title: 'Check prerequisites',
    summary: 'Verify the required tooling before cloning the repository.',
    content: [
      {
        type: 'paragraph',
        text: 'Make sure the following tools are installed and available on your PATH:',
      },
      {
        type: 'list',
        items: [
          'Node.js 18 or newer for building the frontend and executing utility scripts.',
          'Docker Engine with the Docker Compose V2 plugin (use the `docker compose` command, not the legacy `docker-compose`).',
          'Git for cloning the repository and keeping it up to date.',
          'A Redis instance when deploying to production so API sessions persist across restarts.',
        ],
      },
      {
        type: 'callout',
        title: 'Avoid Docker Compose v1',
        text:
          'The legacy CLI fails with recent Docker versions. If the script detects only `docker-compose`, it exits early so you can install the Compose V2 plugin before continuing.',
      },
    ],
  },
  {
    id: 'clone',
    title: 'Clone and review environment files',
    summary: 'Copy the repository and prepare configuration files.',
    content: [
      {
        type: 'code',
        value: ['git clone https://github.com/eduskillbridge/SkillBridge.git', 'cd SkillBridge'],
      },
      {
        type: 'paragraph',
        text:
          'You only need to provide environment values that differ from the defaults. The installer copies every `.env.example` file to its real counterpart before sourcing them, so populate secrets ahead of time when running unattended.',
      },
      {
        type: 'list',
        title: 'Key files to check',
        items: [
          '`backend/.env` — core API configuration such as database credentials, JWT secrets, and SMTP access.',
          '`backend/.env.production` — overrides that apply when Docker Compose runs in production mode.',
          '`frontend/.env.local` or `.env.production` — values that drive the Next.js frontend when running outside Docker.',
        ],
      },
    ],
  },
  {
    id: 'run-script',
    title: 'Run the installer',
    summary: 'Execute the script in development or production mode.',
    content: [
      {
        type: 'paragraph',
        text: 'In development mode the installer automatically launches supporting containers and seeds demo data when requested.',
      },
      {
        type: 'code',
        value: ['./install.sh'],
      },
      {
        type: 'paragraph',
        text:
          'Run `MODE=production ./install.sh` on servers. The script waits for Docker services to become healthy before applying database migrations so production rollouts remain consistent.',
      },
      {
        type: 'paragraph',
        text:
          'When the script reaches the admin account step it either uses credentials supplied through environment variables or prompts you interactively. Keep those credentials safe because they unlock the dashboard after setup.',
      },
    ],
  },
  {
    id: 'environment-options',
    title: 'Environment variables and flags',
    summary: 'Tune how the script behaves during automated installs.',
    content: [
      {
        type: 'list',
        title: 'Common variables',
        items: [
          '`ADMIN_EMAIL` and `ADMIN_PASSWORD` — bypass the interactive prompt for the initial administrator account.',
          '`SEED_DB=true` — populate the database with sample content after migrations finish.',
          '`START_DEV_SERVICES=false` — skip automatically running `docker compose up` if you prefer to manage containers yourself.',
          '`INSTALL_API_ENABLED=true` in `backend/.env` — unlocks the protected `/api/install` endpoints for scripted deployments.',
          '`INSTALL_SETUP_SECRET` — optional shared secret that must be sent as the `X-Install-Setup-Secret` header when automating installer API calls.',
        ],
      },
      {
        type: 'paragraph',
        text:
          'The script exports the values from freshly created `.env` files, so any edits you make before running it take effect immediately. Combine them with shell variables in CI to keep secrets out of source control.',
      },
    ],
  },
  {
    id: 'post-install',
    title: 'After the installer finishes',
    summary: 'Validate the setup and prepare for launch.',
    content: [
      {
        type: 'list',
        items: [
          'Verify that `docker compose ps` shows the API, frontend, database, and supporting services as healthy.',
          'Log in with the admin credentials and configure branding, payment settings, and SMTP defaults inside the dashboard.',
          'If you enabled the installation API, disable it again by removing `INSTALL_API_ENABLED` or setting it to `false` before redeploying.',
          'Back up the `.env` files and uploaded assets (`backend/uploads/app`) so you can restore the environment quickly.',
        ],
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting tips',
    summary: 'Resolve the most common issues reported by new installers.',
    content: [
      {
        type: 'list',
        items: [
          'If migrations fail, fix the reported issue and rerun the installer—the script stops before creating the admin account so you can retry safely.',
          'Ensure `FRONTEND_URL` in `backend/.env` exactly matches where the Next.js app is served (including port) to avoid CORS errors.',
          'Set `DISABLE_EMAILS=true` temporarily if SMTP credentials are not ready; the installer will skip email connectivity checks.',
          'When running outside Docker, mirror the book pricing variables in `frontend/.env.local` using the `NEXT_PUBLIC_` prefix so filters behave consistently.',
        ],
      },
    ],
  },
];

function SectionContent({ section }) {
  if (!section) {
    return null;
  }

  return (
    <div className="space-y-6">
      {section.content.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p key={index} className="text-base leading-7 text-gray-300">
              {block.text}
            </p>
          );
        }

        if (block.type === 'list') {
          return (
            <div key={index} className="space-y-2">
              {block.title && <h4 className="text-sm font-semibold uppercase tracking-wide text-indigo-300">{block.title}</h4>}
              <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-gray-300">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            </div>
          );
        }

        if (block.type === 'code') {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-xl border border-indigo-500/40 bg-indigo-950/60 p-4 text-sm text-indigo-100"
            >
              <code>{Array.isArray(block.value) ? block.value.join('\n') : block.value}</code>
            </pre>
          );
        }

        if (block.type === 'callout') {
          return (
            <div
              key={index}
              className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100"
            >
              <p className="font-semibold uppercase tracking-wide text-amber-300">{block.title}</p>
              <p className="mt-1 text-base leading-7 text-amber-50">{block.text}</p>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

export default function DocumentationLandingPage() {
  const [activeSectionId, setActiveSectionId] = useState(installationSections[0].id);
  const activeSection = useMemo(
    () => installationSections.find((section) => section.id === activeSectionId),
    [activeSectionId],
  );

  return (
    <>
      <PageHead title="Documentation" description="SkillBridge product documentation" />
      <Navbar />

      <section className="bg-gradient-to-r from-indigo-900 via-purple-900 to-black text-white py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">SkillBridge Documentation</h1>
          <p className="text-lg text-indigo-100">
            Follow this guided installation to bootstrap SkillBridge with the unified setup script. Choose a section to learn how
            to prepare your environment, run the installer, and validate the deployment.
          </p>
        </div>
      </section>

      <section className="bg-slate-950 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-8 lg:flex-row">
            <aside className="lg:w-64">
              <div className="rounded-2xl border border-indigo-500/40 bg-indigo-900/30 p-4 shadow-xl shadow-indigo-500/10">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-200">Installation sections</h2>
                <nav className="mt-4 flex flex-col gap-2">
                  {installationSections.map((section) => {
                    const isActive = section.id === activeSectionId;
                    const baseClasses =
                      'rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';
                    const activeClasses = 'border-indigo-400 bg-indigo-500/30 text-white shadow-lg shadow-indigo-500/40';
                    const inactiveClasses =
                      'border-transparent bg-indigo-900/50 text-indigo-200 hover:border-indigo-400/60 hover:bg-indigo-900/80';

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSectionId(section.id)}
                        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                      >
                        <p className="text-base font-semibold">{section.title}</p>
                        <p className="mt-1 text-sm text-indigo-200/80">{section.summary}</p>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            <article className="flex-1">
              <div className="rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-indigo-900/70 via-slate-900/80 to-black/90 p-8 text-white shadow-2xl shadow-indigo-500/20">
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">Guided setup</p>
                <h2 className="mt-2 text-3xl font-bold text-white">{activeSection?.title}</h2>
                <SectionContent section={activeSection} />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-indigo-700 text-white py-16 text-center px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold mb-4">Need more help?</h2>
          <p className="text-indigo-100 mb-6">
            Browse the full documentation in the repository, join the community discussions, or open an issue if you run into trouble during installation.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://github.com/eduskillbridge/SkillBridge/tree/main/docs"
              className="bg-white text-indigo-700 px-6 py-2 rounded shadow hover:bg-gray-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              View repository docs
            </a>
            <a
              href="https://github.com/eduskillbridge/SkillBridge/discussions"
              className="border border-white px-6 py-2 rounded hover:bg-white hover:text-indigo-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Community Support
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
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
