import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';

export default function DeleteAccountPage() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <PageHead title="Delete Account" />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <h1 className="text-3xl font-bold text-yellow-500">Delete Your Account</h1>
        <p>
          We're sorry to see you go. If you'd like to delete your SkillBridge account and remove your personal data, follow these steps:
        </p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Log in and open your profile settings.</li>
          <li>Click the "Delete Account" button at the bottom of the page.</li>
          <li>Confirm when prompted to permanently remove your data.</li>
        </ol>
        <p>
          If you can't access your account, email
          {' '}<a href="mailto:support@skillbridge.com" className="text-yellow-300 underline">support@skillbridge.com</a>
          {' '}and we'll assist with the deletion.
        </p>
      </main>
      <Footer />
    </div>
  );
}
