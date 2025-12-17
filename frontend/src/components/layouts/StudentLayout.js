import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

export default function StudentLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar role="student" />
      <div className="flex-1 bg-gray-50">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
