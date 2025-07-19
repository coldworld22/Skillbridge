import { useEffect, useState } from 'react';
import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { getPolicies } from '@/services/policiesService';

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPolicies();
        setContent(data['Privacy Policy']?.content || '');
      } catch (_err) {
        /* ignore */
      }
    };
    load();
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <PageHead title="Privacy Policy" />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <h1 className="text-3xl font-bold text-yellow-500">Privacy Policy</h1>
        <div
          className="prose prose-sm max-w-none text-yellow-100"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </main>
      <Footer />
    </div>
  );
}
