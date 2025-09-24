import Link from "next/link";
import { FaServer, FaBookOpen, FaToolbox, FaUserShield } from "react-icons/fa";

import PageHead from "@/components/common/PageHead";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

const DOCS_BASE = "https://github.com/eduskillbridge/SkillBridge/blob/main/docs";

const docSections = [
  {
    title: "Getting Started",
    description:
      "Install SkillBridge locally, learn the platform architecture, and understand the deployment workflow.",
    icon: <FaBookOpen className="text-3xl text-yellow-400" aria-hidden="true" />,
    links: [
      { label: "Installation Guide", href: `${DOCS_BASE}/installation.md` },
      { label: "Architecture Overview", href: `${DOCS_BASE}/architecture.md` },
      { label: "Deployment Checklist", href: `${DOCS_BASE}/deployment.md` },
    ],
  },
  {
    title: "Platform Operations",
    description:
      "Walk through student journeys, class management, and integrations to keep your learning platform running smoothly.",
    icon: <FaServer className="text-3xl text-yellow-400" aria-hidden="true" />,
    links: [
      { label: "Student Enrollment Workflow", href: `${DOCS_BASE}/student-enrollment-workflow.md` },
      { label: "Book Distribution", href: `${DOCS_BASE}/book-workflow.md` },
      { label: "Third-party Integrations", href: `${DOCS_BASE}/admin-third-party-integrations.md` },
    ],
  },
  {
    title: "Administration",
    description:
      "Configure alerts, coupons, messaging, and governance to tailor SkillBridge to your organization.",
    icon: <FaUserShield className="text-3xl text-yellow-400" aria-hidden="true" />,
    links: [
      { label: "Alerts & Notifications", href: `${DOCS_BASE}/admin-alerts.md` },
      { label: "Coupon Management", href: `${DOCS_BASE}/coupon-management.md` },
      { label: "License Verification", href: `${DOCS_BASE}/license-verification.md` },
    ],
  },
  {
    title: "Developer Resources",
    description:
      "Extend the platform with APIs, customize the marketplace, and prepare polished releases.",
    icon: <FaToolbox className="text-3xl text-yellow-400" aria-hidden="true" />,
    links: [
      { label: "REST API Reference", href: `${DOCS_BASE}/api-docs.md` },
      { label: "Marketplace Styling", href: `${DOCS_BASE}/subscription-plan-style.md` },
      { label: "Release Checklist", href: `${DOCS_BASE}/release-checklist.md` },
    ],
  },
];

export default function DocumentationLandingPage() {
  return (
    <>
      <PageHead title="Documentation" description="SkillBridge platform documentation and resources" />
      <Navbar />

      <header className="bg-gradient-to-br from-indigo-900 via-black to-gray-900 text-white py-24 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">SkillBridge Documentation</h1>
        <p className="max-w-3xl mx-auto text-lg text-gray-200">
          Explore guides and references that help administrators, instructors, and developers configure, launch, and extend the
          SkillBridge platform.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="https://github.com/eduskillbridge/SkillBridge/tree/main/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-yellow-400 text-black font-semibold px-5 py-3 rounded-lg shadow hover:bg-yellow-300 transition"
          >
            View Docs on GitHub
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-yellow-400 text-yellow-400 px-5 py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition"
          >
            Contact Support
          </Link>
        </div>
      </header>

      <main className="bg-black text-white py-16 px-6">
        <section className="max-w-6xl mx-auto grid gap-10 md:grid-cols-2">
          {docSections.map((section) => (
            <article
              key={section.title}
              className="bg-gray-900 rounded-2xl shadow-lg border border-gray-800 p-8 flex flex-col gap-6 hover:border-yellow-400 transition"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-semibold">{section.title}</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">{section.description}</p>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 text-yellow-300 hover:text-yellow-200"
                    >
                      <span className="font-medium">{link.label}</span>
                      <span className="text-sm text-yellow-400 transition group-hover:translate-x-1">↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </main>

      <section className="bg-gray-900 text-gray-200 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-semibold">Need something else?</h2>
          <p>
            Our documentation covers installation, operations, integrations, and release processes. If you require a different
            guide or have feedback, let us know and we’ll help you find the right resource.
          </p>
          <Link
            href="mailto:support@eduskillbridge.net"
            className="inline-flex items-center gap-2 text-yellow-300 hover:text-yellow-200"
          >
            Email support@eduskillbridge.net
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}

import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"], nextI18NextConfig)),
    },
  };
}
