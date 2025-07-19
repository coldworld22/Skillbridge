import { useEffect, useState } from 'react';
import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { getPolicies } from '@/services/policiesService';

export default function DeleteAccountPage() {
  const [content, setContent] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPolicies();
        setContent(data['Delete Account']?.content || '');
      } catch (_err) {}
    };
    load();
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <PageHead title="Delete Account" />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <h1 className="text-3xl font-bold text-yellow-500">Delete Account</h1>
        <div
          className="prose prose-sm max-w-none text-yellow-100"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </main>
      <Footer />
    </div>
  );
}
