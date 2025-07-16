import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';

export default function TermsPage() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <PageHead title="Terms of Service" />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <h1 className="text-3xl font-bold text-yellow-500">Terms of Service</h1>
        <p>
          These terms govern your use of SkillBridge. By accessing the platform
          you agree to comply with them and any applicable laws.
        </p>
        <p>
          We may modify these terms at any time. Continuing to use the service
          means you accept the updated terms.
        </p>
      </main>
      <Footer />
    </div>
  );
}
