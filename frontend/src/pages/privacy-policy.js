import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <PageHead title="Privacy Policy" />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <h1 className="text-3xl font-bold text-yellow-500">Privacy Policy</h1>
        <p>
          We respect your privacy and are committed to protecting your personal
          information. This policy explains how we collect, use and safeguard
          your data when you use our services.
        </p>
        <p>
          By accessing SkillBridge you agree to this privacy policy. We may
          update it from time to time, so please review it periodically.
        </p>
      </main>
      <Footer />
    </div>
  );
}
