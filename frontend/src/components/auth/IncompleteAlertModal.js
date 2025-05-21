import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import useAuthStore from "@/store/auth/authStore";
import { FaTimesCircle, FaUserEdit, FaEnvelopeOpenText, FaPhoneAlt } from "react-icons/fa";

const profilePaths = {
    admin: "/dashboard/admin/profile/edit",
    instructor: "/dashboard/instructor/profile/edit",
    student: "/dashboard/student/profile/edit",
    superadmin: "/dashboard/admin/profile/edit",
};

export default function IncompleteAlertModal() {
    const { user } = useAuthStore();
    const [show, setShow] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true); // Ensure we're on client-side
    }, []);

    useEffect(() => {
        if (!user) {
            setShow(false);
            return;
        }

        // More flexible check for falsey values (false, null, undefined)
        const needsUpdate =
            user.profile_complete !== true ||
            user.is_email_verified !== true ||
            user.is_phone_verified !== true;

        console.log("User verification status:", {
            profile_complete: user.profile_complete,
            is_email_verified: user.is_email_verified,
            is_phone_verified: user.is_phone_verified,
            needsUpdate
        });

        if (needsUpdate) {
            setShow(true);
            document.body.style.overflow = "hidden";
        } else {
            setShow(false);
            document.body.style.overflow = "auto";
        }

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [user?.profile_complete, user?.is_email_verified, user?.is_phone_verified]);

    if (!isClient || !show || !user) return null;

    const userRole = user?.role?.toLowerCase();
    const rolePath = profilePaths[userRole] || "/dashboard";

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-2xl text-gray-800 text-center animate-fade-in">
                <div className="mb-4">
                    <h2 className="text-2xl font-extrabold text-yellow-600 flex items-center justify-center gap-2">
                        <FaTimesCircle className="text-red-500" /> Action Required
                    </h2>
                    <p className="text-gray-600 text-sm mt-2">
                        Your account is not fully verified. Please complete the following steps to continue using SkillBridge:
                    </p>
                </div>

                <ul className="space-y-3 text-sm text-left mb-6">
                    {!user.profile_complete && (
                        <li className="flex items-center gap-2 text-red-600">
                            <FaUserEdit /> Profile is incomplete
                        </li>
                    )}
                    {!user.is_email_verified && (
                        <li className="flex items-center gap-2 text-red-600">
                            <FaEnvelopeOpenText /> Email is not verified
                        </li>
                    )}
                    {!user.is_phone_verified && (
                        <li className="flex items-center gap-2 text-red-600">
                            <FaPhoneAlt /> Phone is not verified
                        </li>
                    )}
                </ul>

                <Link href={rolePath}>
                    <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow">
                        Complete My Profile
                    </button>
                </Link>
            </div>
        </div>,
        document.body
    );
}
