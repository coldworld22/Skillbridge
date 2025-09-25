import { useMemo, useState } from 'react';

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import Footer from '@/components/website/sections/Footer';
import Navbar from '@/components/website/sections/Navbar';
import PageHead from '@/components/common/PageHead';
import nextI18NextConfig from '../../../next-i18next.config.js';

const sections = [
  {
    id: 'overview',
    title: 'Overview',
    blurb: 'Understand what the SkillBridge installation script does and when to use it.',
    content: (
      <>
        <p>
          The SkillBridge installer script automates the most time-consuming parts of standing up a
          local or production environment. It copies <code>.env</code> templates, installs dependencies,
          applies database migrations, seeds demo content (when requested), and provisions the first
          administrator account. Use it whenever you want a reproducible setup that mirrors the
          official deployment pipeline.
        </p>
        <p>
          You can run the script in an interactive mode that prompts for values or feed credentials
          through environment variables for fully unattended installs. The same entry point supports
          both development and production targets, ensuring consistent behavior across teams.
        </p>
      </>
    ),
  },
  {
    id: 'prerequisites',
    title: 'Prerequisites',
    blurb: 'Verify that your workstation or server meets the minimum requirements.',
    content: (
      <>
        <p>Install or verify the following before executing the installer:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-200">
          <li>
            <span className="font-semibold">Node.js 18+</span> – required for running database migrations
            and seeding scripts.
          </li>
          <li>
            <span className="font-semibold">Docker with the Compose V2 plugin</span> – the script relies on
            the <code>docker compose</code> command. The legacy <code>docker-compose</code> binary is not supported.
          </li>
          <li>
            <span className="font-semibold">Git</span> – to clone the SkillBridge repository.
          </li>
          <li>
            <span className="font-semibold">Redis (production only)</span> – used for persisting sessions
            when running the backend in production mode.
          </li>
        </ul>
        <p>
          Production deployments should also expose the desired domain in DNS and have TLS certificates
          ready if HTTPS is enforced by your ingress or load balancer.
        </p>
      </>
    ),
  },
  {
    id: 'download',
    title: 'Download the script',
    blurb: 'Fetch the latest version of install.sh straight from the repository.',
    content: (
      <>
        <p>Clone the repository and move into the project directory:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`git clone https://github.com/eduskillbridge/SkillBridge.git
cd Skillbridge`}
        </pre>
        <p>
          Alternatively, grab only the installer for quick experiments by piping it directly to
          <code>bash</code>:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl -fsSL https://raw.githubusercontent.com/eduskillbridge/SkillBridge/main/install.sh | bash`}
        </pre>
        <p>
          The repository approach is recommended for long-lived environments so you can inspect the
          script, customize configuration files, and commit changes to your own fork if needed.
        </p>
      </>
    ),
  },
  {
    id: 'configure',
    title: 'Configure environment variables',
    blurb: 'Provide credentials and settings the installer needs to bootstrap your stack.',
    content: (
      <>
        <p>
          When the installer runs, it copies every <code>.env.example</code> file to its corresponding
          <code>.env</code> if it is missing. Adjust the generated files before rerunning the script if you
          need custom values. The most commonly tuned variables are:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-200">
          <li>
            <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> – used to create the initial admin user.
          </li>
          <li>
            <code>FRONTEND_URL</code> – the URL(s) that are allowed to communicate with the API.
          </li>
          <li>
            <code>DATABASE_URL</code> / <code>DATABASE_USER</code> / <code>DATABASE_PASSWORD</code> – production
            database connection details when you are not using the bundled Postgres container.
          </li>
          <li>
            <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code> – email
            credentials so the script can validate outbound mail early.
          </li>
        </ul>
        <p>
          Pass any of these as environment variables when invoking the installer to avoid interactive
          prompts in CI/CD pipelines:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='supersafe' \
SEED_DB=true \
bash install.sh --mode production`}
        </pre>
        <p>
          In development mode you can skip automatically starting Docker services by setting
          <code>START_DEV_SERVICES=false</code>.
        </p>
      </>
    ),
  },
  {
    id: 'run-script',
    title: 'Run the installer',
    blurb: 'Execute the script in development or production mode and watch it provision the stack.',
    content: (
      <>
        <p>
          Execute the script from the repository root. Choose the mode that matches your target
          environment:
        </p>
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Development mode</h3>
            <p className="text-gray-200 mb-3">
              Spins up the Docker Compose stack in detached mode, runs migrations, and seeds optional
              demo data when <code>SEED_DB=true</code>.
            </p>
            <pre className="bg-black text-gray-100 p-3 rounded-md overflow-x-auto text-sm">
{`bash install.sh --mode development`}
            </pre>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Production mode</h3>
            <p className="text-gray-200 mb-3">
              Ensures Docker services are running, applies migrations against the production database,
              and then provisions the admin user.
            </p>
            <pre className="bg-black text-gray-100 p-3 rounded-md overflow-x-auto text-sm">
{`bash install.sh --mode production`}
            </pre>
          </div>
        </div>
        <p>
          The script halts immediately if migrations fail so you can resolve the issue before an
          incomplete deployment progresses further.
        </p>
      </>
    ),
  },
  {
    id: 'post-install',
    title: 'Post-install checklist',
    blurb: 'Verify that critical services are online and lock down administrative access.',
    content: (
      <>
        <ul className="list-disc list-inside space-y-1 text-gray-200">
          <li>Log in using the admin credentials supplied to the installer.</li>
          <li>
            Navigate to <code>/admin/settings/general</code> to confirm branding, domains, and contact
            details.
          </li>
          <li>
            Upload production logos and favicons under <strong>Appearance</strong> so the frontend pulls
            the correct assets.
          </li>
          <li>Review email deliverability by triggering a password reset from the admin dashboard.</li>
          <li>
            If running in production, disable the installation API by setting
            <code>INSTALL_API_ENABLED=false</code> and redeploying the backend service.
          </li>
        </ul>
        <p>
          When everything checks out, commit your tailored configuration files to a secure repository
          so the environment can be recreated quickly in the future.
        </p>
      </>
    ),

  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting tips',
    blurb: 'Resolve the most common installation issues quickly.',
    content: (
      <>
        <ul className="list-disc list-inside space-y-1 text-gray-200">
          <li>
            <strong>Docker Compose version error:</strong> Install the V2 plugin so the
            <code>docker compose</code> command is available. The script exits early if only the legacy
            binary is detected.
          </li>
          <li>
            <strong>Migrations fail because the database is unavailable:</strong> Double-check that the
            Postgres container is running (or that your external database is reachable) before retrying.
          </li>
          <li>
            <strong>SMTP verification fails:</strong> Provide valid credentials or temporarily set
            <code>DISABLE_EMAILS=true</code> while finishing the rest of the setup.
          </li>
          <li>
            <strong>Admin login issues:</strong> Re-run the installer with a new
            <code>ADMIN_PASSWORD</code> or reset the password via the API using another admin account.
          </li>
        </ul>
        <p>
          Check the <code>install.log</code> file generated in the project root whenever the script exits
          unexpectedly—it captures the complete command output for easier debugging.
        </p>
      </>
    ),
  },
];

export default function DocumentationLandingPage() {
  const [activeSectionId, setActiveSectionId] = useState(sections[0].id);

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) || sections[0],
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
            Follow this guided installation to bootstrap SkillBridge with the unified setup script. Choose a section to learn how
            to prepare your environment, run the installer, and validate the deployment.
          </p>
        </div>
      </section>

      <section className="bg-black py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center text-white">
            <h2 className="text-3xl font-semibold mb-4">Installation script walkthrough</h2>
            <p className="text-gray-300">
              Follow the guided flow below to configure and execute <code>install.sh</code> for any environment.
            </p>
          </div>

          <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <aside className="md:w-72 border-b md:border-b-0 md:border-r border-gray-800 bg-gray-900/60 p-6">
                <div className="md:hidden mb-4">
                  <label htmlFor="docs-section-picker" className="block text-sm font-medium text-gray-300 mb-2">
                    Jump to section
                  </label>
                  <select
                    id="docs-section-picker"
                    value={activeSectionId}
                    onChange={(event) => setActiveSectionId(event.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-lg px-3 py-2"
                  >
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </div>

                <nav className="hidden md:flex md:flex-col md:gap-2" aria-label="Installation sections">
                  {sections.map((section) => {
                    const isActive = section.id === activeSectionId;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSectionId(section.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-950 ${
                          isActive
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                            : 'bg-gray-900/70 border-gray-800 text-gray-200 hover:bg-gray-800'
                        }`}
                      >
                        <span className="block text-sm uppercase tracking-wide text-gray-300 mb-1">
                          Step {sections.findIndex((item) => item.id === section.id) + 1}
                        </span>
                        <span className="block text-lg font-semibold">{section.title}</span>
                        <span className="block text-xs text-gray-300 mt-1">{section.blurb}</span>
                      </button>
                    );
                  })}
                </nav>
              </aside>

              <article className="flex-1 p-6 md:p-10 text-gray-100">
                <header className="border-b border-gray-800 pb-6 mb-8">
                  <p className="text-sm uppercase tracking-wide text-indigo-300">
                    Step {sections.findIndex((item) => item.id === activeSection.id) + 1}
                  </p>
                  <h3 className="text-3xl font-bold text-white mt-2 mb-3">{activeSection.title}</h3>
                  <p className="text-gray-300 max-w-3xl">{activeSection.blurb}</p>
                </header>

                <div className="prose prose-invert prose-indigo max-w-none space-y-6">
                  {activeSection.content}
                </div>

                <div className="mt-12 border-t border-gray-800 pt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
                  <span>Need deeper context? Read the full installation reference in our documentation portal.</span>
                  <a
                    href="https://eduskillbridge.net/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200"
                  >
                    Open installation docs
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </article>
            </div>
          </div>

        </div>
      </section>

      <section className="bg-indigo-700 text-white py-16 text-center px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-semibold mb-4">Need more help?</h2>
          <p className="text-indigo-100 mb-6">
            Browse the full documentation on our website, join the community discussions, or open an issue if you run into trouble during installation.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://eduskillbridge.net/docs"
              className="bg-white text-indigo-700 px-6 py-2 rounded shadow hover:bg-gray-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              Browse docs online
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
