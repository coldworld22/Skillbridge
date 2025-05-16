import Link from 'next/link';
import AdminLayout from '@/components/layouts/AdminLayout';
import AdminClassesTable from '@/components/admin/online-classes/AdminClassesTable';



const dummyClasses = [
  {
    id: 1, title: "React & Next.js Bootcamp", instructor: "Ayman Khalid", date: "2025-05-13", category: "Web Development", price: 49, status: "Upcoming"
  },
  {
    id: 2, title: "UX Design Fundamentals", instructor: "Lina Al Harthy", date: "2025-05-18", category: "Design", price: 0, status: "Full"
  },
  {
    id: 3, title: "Java for Beginners", instructor: "Omar Al-Fahad", date: "2025-06-01", category: "Programming", price: 30, status: "Upcoming"
  },
  {
    id: 4, title: "Python for Data Analysis", instructor: "Sara Al-Bassam", date: "2025-04-22", category: "Data Science", price: 55, status: "Ongoing"
  },
  {
    id: 5, title: "AI & Machine Learning Intro", instructor: "Dr. Ahmed Al-Qahtani", date: "2025-03-01", category: "AI", price: 120, status: "Completed"
  },
  {
    id: 6, title: "Cybersecurity Basics", instructor: "Noura Fahad", date: "2025-07-01", category: "Security", price: 35, status: "Upcoming"
  },
  {
    id: 7, title: "Advanced CSS Techniques", instructor: "Bader Saleh", date: "2025-06-15", category: "Web Design", price: 20, status: "Ongoing"
  },
  {
    id: 8, title: "Cloud Computing Fundamentals", instructor: "Huda Al Saud", date: "2025-06-10", category: "Cloud", price: 65, status: "Upcoming"
  }
];


export default function AdminOnlineClassesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">📚 Manage Online Classes</h1>

        <Link href="/dashboard/admin/online-classes/create" className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition duration-200">
          ➕ Create New Class
        </Link>
      </div>


      <AdminClassesTable classes={dummyClasses} />

    </div>
  );
}

AdminOnlineClassesPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
