// components/admin/community/NavCard.js
import Link from "next/link";

export default function NavCard({ href, icon, label }) {
  return (
    <Link href={href}>
      <div className="bg-white hover:bg-gray-100 transition p-5 rounded-xl cursor-pointer shadow flex items-center gap-4 border border-gray-200">
        <div className="text-3xl text-yellow-500">{icon}</div>
        <div className="text-base font-semibold text-gray-800">{label}</div>
      </div>
    </Link>
  );
}
