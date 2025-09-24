import { useMemo, useState } from 'react';

import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';

const installationSections = [
  {
    id: 'overview',
    title: 'Overview',
    content: (
      <div className="space-y-4 text-gray-200">
        <p>
          This guide walks you through preparing your environment, running the
          bundled installer, and manually tweaking configuration so you can get
          SkillBridge running locally or on a production server without jumping
          between external resources.
        </p>
        <p>
          Every step below mirrors the commands baked into{' '}
          <code className="text-indigo-300">install.sh</code>. Follow the
          sections in order if you are setting up the platform for the first
          time, or jump directly to a topic from the sidebar when you only need
          to reference a specific command.
        </p>
      </div>
    ),
  },
  {
    id: 'prerequisites',
    title: 'Prerequisites',
    content: (
      <div className="space-y-4 text-gray-200">
        <p>
          Verify that the following tooling is installed before you attempt to
          run the installer. Newer releases of Docker require the Compose V2
          plugin ({' '}
          <code className="text-indigo-300">docker compose</code>) so double
          check that the legacy{' '}
          <code className="text-indigo-300">docker-compose</code> v1 binary is
          not the only one available on your system.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Node.js 18 or later</li>
          <li>Docker Engine with the Compose V2 plugin</li>
          <li>Git</li>
          <li>
            Redis (or a compatible store) when you plan to persist sessions in
            production
          </li>
        </ul>
        <p>
          When the installer detects only the v1 Compose binary it stops early
          with a warning so you can install the supported plugin before
          continuing.
        </p>
      </div>
    ),
  },
  {
    id: 'clone',
    title: 'Clone the repository',
    content: (
      <div className="space-y-4 text-gray-200">
        <p>
          Start by cloning the SkillBridge repository and switching into the new
          project directory:
        </p>
        <pre className="rounded-lg bg-black/40 p-4 text-sm text-indigo-200">
{`git clone <repo-url>
cd Skillbridge`}
        </pre>
        <p>
          Replace <code className="text-indigo-300">&lt;repo-url&gt;</code> with
          your fork or the upstream repository depending on how you plan to
          contribute.
        </p>
      </div>
    ),
  },
  {
    id: 'installer',
    title: 'Run the automated installer',
    content: (
      <div className="space-y-4 text-gray-200">
        <p>
          The root <code className="text-indigo-300">install.sh</code> script
          provisions environment files, runs migrations, and optionally seeds
          the database. Provide admin credentials via environment variables when
          you need to run the installer non-interactively (for example inside a
          CI pipeline).
        </p>
        <pre className="rounded-lg bg-black/40 p-4 text-sm text-indigo-200">
{`# development defaults
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=change-me \
SEED_DB=true \
./install.sh --mode=development

# production mode keeps services running and executes migrations
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=super-secret \
./install.sh --mode=production`}
        </pre>
        <p>
          Use <code className="text-indigo-300">SEED_DB=true</code> to populate
          demo data and <code className="text-indigo-300">START_DEV_SERVICES=false</code>{' '}
          when you prefer to launch Docker services yourself.
        </p>
      </div>
    ),
  },
  {
    id: 'backend-env',
    title: 'Backend environment configuration',
    content: (
      <div className="space-y-4 text-gray-200">
        <p>
          The installer copies <code className="text-indigo-300">.env.example</code>{' '}
          files to <code className="text-indigo-300">.env</code> automatically.
          If you need to configure them manually, use the following commands:
        </p>
        <pre className="rounded-lg bg-black/40 p-4 text-sm text-indigo-200">
{`cp backend/.env.example backend/.env
cp backend/.env.production.example backend/.env.production`}
        </pre>
        <p>
          Update branding and email settings so transactional messages and
          installer prompts use the proper name:
        </p>
        <pre className="rounded-lg bg-black/40 p-4 text-sm text-indigo-200">
{`APP_NAME=SkillBridge
DISABLE_EMAILS=false
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password`}
        </pre>
        <p>
          Ensure <code className="text-indigo-300">FRONTEND_URL</code> matches
          the origins where the Next.js app will run. Separate multiple URLs
          with commas to keep CORS in sync across deployments.
        </p>
      </div>
    ),
  },
  {
    id: 'uploads-and-security',
    title: 'Uploads, CORS, and security settings',
    content: (
      <div className="space-y-4 text-gray-200">
        <p>
          Prepare the uploads directory and fine tune API access controls before
          launching the stack:
        </p>
        <pre className="rounded-lg bg-black/40 p-4 text-sm text-indigo-200">
{`mkdir -p backend/uploads/app
FRONTEND_URL=http://localhost:3000,https://example.com
EXTRA_CORS_ORIGINS=https://admin.example.com,https://docs.example.com
RATE_LIMIT_MAX=2000
RATE_LIMIT_WINDOW_MS=300000`}
        </pre>
        <p>
          Set <code className="text-indigo-300">REDIS_URL</code> when running in
          production so session data persists between deploys, and configure
          <code className="text-indigo-300">COOKIE_SECURE</code> /{' '}
          <code className="text-indigo-300">COOKIE_SAMESITE</code> if you need
          cross-domain cookies without HTTPS.
        </p>
      </div>
    ),
  },
  {
    id: 'install-api',
    title: 'Using the installation API',
    content: (
      <div className="space-y-4 text-gray-200">
        <p>
          The backend exposes optional endpoints at{' '}
          <code className="text-indigo-300">/api/install</code> for fully
          automated deployments. Enable them temporarily by setting{' '}
          <code className="text-indigo-300">INSTALL_API_ENABLED=true</code> in{' '}
          <code className="text-indigo-300">backend/.env</code> and restarting
          the service.
        </p>
        <p>
          Authenticate with an administrator token and send the configuration
          payload shown below to <code className="text-indigo-300">POST
          /api/install/run</code>:
        </p>
        <pre className="rounded-lg bg-black/40 p-4 text-sm text-indigo-200 overflow-x-auto">
{`{
  "adminEmail": "admin@example.com",
  "adminPassword": "super-secret",
  "databaseUrl": "postgres://user:password@db:5432/skillbridge",
  "databaseUser": "user",
  "databasePassword": "password",
  "smtpHost": "smtp.example.com",
  "smtpPort": 587,
  "smtpUser": "mailer",
  "smtpPassword": "smtp-password",
  "defaultFromEmail": "notifications@example.com",
  "appDisplayName": "SkillBridge",
  "logoUrl": "https://assets.example.com/logo.png"
}`}
        </pre>
        <p>
          Configure <code className="text-indigo-300">INSTALL_SETUP_SECRET</code>
          to require an additional{' '}
          <code className="text-indigo-300">X-Install-Setup-Secret</code> header
          on every installer request. Disable the API again once setup is
          complete.
        </p>
      </div>
    ),
  },
  {
    id: 'frontend-env',
    title: 'Frontend environment options',
    content: (
      <div className="space-y-4 text-gray-200">
        <p>
          When you run the Next.js app outside Docker (for example with{' '}
          <code className="text-indigo-300">npm run dev</code>) create{' '}
          <code className="text-indigo-300">frontend/.env.local</code> with these
          overrides:
        </p>
        <pre className="rounded-lg bg-black/40 p-4 text-sm text-indigo-200">
{`NEXT_PUBLIC_API_BASE_URL=http://localhost:5002/api
NEXT_PUBLIC_BOOK_PRICE_RANGE_DEFAULT=100
NEXT_PUBLIC_BOOK_PRICE_RANGE_MAX=500
NEXT_PUBLIC_TRUSTED_ICON_HOSTS=yourdomain.com,cdn.yourdomain.com`}
        </pre>
        <p>
          Production builds should rely on{' '}
          <code className="text-indigo-300">frontend/.env.production</code> and
          avoid leaking local defaults. Update values to match the public domain
          that will serve the frontend so OAuth redirects and CORS settings stay
          aligned.
        </p>
      </div>
    ),
  },
  {
    id: 'admin-passwords',
    title: 'Initial admin passwords',
    content: (
      <div className="space-y-4 text-gray-200">
        <p>
          To control the credentials generated by the seeding process, define
          <code className="text-indigo-300">ADMIN_INITIAL_PASSWORD</code> and{' '}
          <code className="text-indigo-300">SUPERADMIN_INITIAL_PASSWORD</code>{' '}
          before running the installer or database seeds. When omitted, random
          passwords are created and printed to the console.
        </p>
      </div>
    ),
  },
];

export default function DocumentationLandingPage() {
  const [activeSectionId, setActiveSectionId] = useState(installationSections[0].id);

  const activeSection = useMemo(
    () => installationSections.find((section) => section.id === activeSectionId) ?? installationSections[0],
    [activeSectionId],
  );

  return (
    <>
      <PageHead title="Installation Guide" description="Install the SkillBridge platform with the bundled setup scripts." />
      <Navbar />

      <section className="bg-gradient-to-r from-indigo-900 via-purple-900 to-black text-white py-24 px-6 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold md:text-5xl">Install SkillBridge</h1>
          <p className="text-lg text-indigo-100">
            Learn how to prepare your environment, run the installer, and
            configure both backend and frontend services without leaving the
            product site.
          </p>
        </div>
      </section>

      <section className="bg-black py-16 px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row">
          <aside className="lg:w-72">
            <div className="sticky top-24 rounded-2xl border border-indigo-900/60 bg-gradient-to-b from-indigo-950/60 to-black p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-indigo-300">Installation sections</h2>
              <nav className="mt-6 flex flex-col gap-2">
                {installationSections.map((section) => {
                  const isActive = section.id === activeSectionId;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSectionId(section.id)}
                      className={`rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                        isActive
                          ? 'border-indigo-500/70 bg-indigo-600/30 text-white shadow-lg'
                          : 'border-indigo-900/40 bg-indigo-950/40 text-indigo-100 hover:border-indigo-700/60 hover:bg-indigo-900/30'
                      }`}
                    >
                      <span className="block text-sm font-semibold uppercase tracking-wide">
                        {section.title}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <article className="flex-1 rounded-3xl border border-indigo-900/60 bg-gradient-to-b from-indigo-950/40 to-black p-8 shadow-xl">
            <header className="mb-8 border-b border-indigo-900/40 pb-6">
              <p className="text-sm uppercase tracking-wider text-indigo-300">Installation Section</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{activeSection.title}</h2>
            </header>
            <div className="prose prose-invert max-w-none text-gray-200 prose-pre:bg-black/40 prose-pre:border prose-pre:border-indigo-900/60 prose-pre:text-indigo-100">
              {activeSection.content}
            </div>
          </article>
        </div>
      </section>

      <section className="bg-indigo-700 text-white py-16 text-center px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-semibold mb-4">Need more help?</h2>
          <p className="text-indigo-100 mb-6">
            Open a discussion or file an issue on GitHub and the SkillBridge team
            will help you debug installation and deployment problems.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://github.com/eduskillbridge/SkillBridge/discussions"
              className="rounded border border-white px-6 py-2 font-medium transition hover:bg-white hover:text-indigo-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Community Support
            </a>
            <a
              href="https://github.com/eduskillbridge/SkillBridge/issues/new/choose"
              className="rounded bg-white px-6 py-2 font-medium text-indigo-700 shadow transition hover:bg-gray-100"
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
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
