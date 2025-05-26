// 📁 components/auth/UserDropdown.js
import { useState } from "react";
import useAuthStore from "@/store/auth/authStore";

export default function UserDropdown() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="rounded-full bg-gray-700 w-8 h-8 flex items-center justify-center">
        👤
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
          <div className="px-4 py-2 text-sm text-gray-700">{user?.full_name}</div>
          <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
