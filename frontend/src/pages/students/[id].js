import { useRouter } from 'next/router';
import Navbar from '@/components/website/sections/Navbar';

export default function PublicStudentProfile() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Student Profile</h1>
        {id ? (
          <p className="text-gray-700">Profile for student ID: {id}</p>
        ) : (
          <p className="text-gray-500">Loading...</p>
        )}
      </main>
    </div>
  );
}
