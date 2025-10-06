import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DOMPurify from "isomorphic-dompurify";
import api from "@/services/api/api";
import useAuthStore from "@/store/auth/authStore";

export default function PopupAnnouncement() {
  const [popup, setPopup] = useState(null);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    const fetchPopup = async () => {
      try {
        const role = user?.role?.toLowerCase();
        const audience = !user
          ? "guest"
          : role === "student"
          ? "student"
          : role === "instructor"
          ? "instructor"
          : "logged-in";

        const { data } = await api.get("popup-announcements/active", {
          params: { audience, page: router.pathname },
        });
        const [ann] = data?.data || [];
        if (!ann) return;
        if (ann.once_per_session && typeof window !== "undefined") {
          if (sessionStorage.getItem(`popup_${ann.id}`)) return;
          sessionStorage.setItem(`popup_${ann.id}`, "shown");
        }
        setPopup(ann);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Failed to load popup", err);
        }
      }
    };
    fetchPopup();
  }, [user, router.pathname]);

  if (!popup) return null;

  const positionClass =
    popup.position === "top"
      ? "top-4 left-1/2 -translate-x-1/2"
      : popup.position === "bottom"
      ? "bottom-4 left-1/2 -translate-x-1/2"
      : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

  const themeClass =
    popup.theme === "blue"
      ? "bg-blue-500 text-white"
      : popup.theme === "green"
      ? "bg-green-500 text-white"
      : popup.theme === "red"
      ? "bg-red-500 text-white"
      : "bg-yellow-500 text-black";

  return (
    <div className={`fixed z-50 ${positionClass} transform`}> 
      <div className={`p-4 rounded shadow ${themeClass}`}> 
        {popup.title && <h3 className="font-bold mb-2">{popup.title}</h3>}
        <div
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(popup.message) }}
        />
      </div>
    </div>
  );
}
