import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import RequestCard from "@/components/instructors/requests/RequestCard";
import {
  fetchInstructorBookings,
  updateInstructorBooking,
} from "@/services/instructor/bookingService";
import { API_BASE_URL } from "@/config/config";
import nextI18NextConfig from "../../../../next-i18next.config.js";

const ABSOLUTE_URL_REGEX = /^(https?:)?\/\//i;
const DATA_URL_PREFIXES = ["data:", "blob:"];
const PLACEHOLDER_BASE = "https://via.placeholder.com/40x40?text=";

const buildPlaceholder = (label = "S") =>
  `${PLACEHOLDER_BASE}${encodeURIComponent(label)}`;

const buildAvatarUrl = (value, fallbackLabel = "S") => {
  if (!value) {
    return buildPlaceholder(fallbackLabel);
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return buildPlaceholder(fallbackLabel);
  }

  if (
    ABSOLUTE_URL_REGEX.test(trimmed) ||
    DATA_URL_PREFIXES.some((prefix) => trimmed.startsWith(prefix))
  ) {
    return trimmed;
  }

  const base =
    (process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL || "").replace(
      /\/$/,
      ""
    );
  const normalizedPath = trimmed.startsWith("/")
    ? trimmed
    : `/${trimmed}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
};

export default function InstructorRequestsPage() {
  const { t } = useTranslation("dashboard");
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const tabs = useMemo(
    () => [
      { value: "all", label: t("instructorRequestsPage.tabs.all", "All") },
      {
        value: "pending",
        label: t("instructorRequestsPage.tabs.pending", "Pending"),
      },
      {
        value: "approved",
        label: t("instructorRequestsPage.tabs.approved", "Approved"),
      },
      {
        value: "declined",
        label: t("instructorRequestsPage.tabs.declined", "Declined"),
      },
    ],
    [t]
  );

  const statusLabels = useMemo(
    () => ({
      pending: t("instructorRequestsPage.status.pending", "Pending"),
      approved: t("instructorRequestsPage.status.approved", "Approved"),
      declined: t("instructorRequestsPage.status.declined", "Declined"),
      unknown: t("instructorRequestsPage.status.unknown", "Unknown"),
    }),
    [t]
  );

  const actionLabels = useMemo(
    () => ({
      chat: t("instructorRequestsPage.actions.chat", "Chat"),
      accept: t("instructorRequestsPage.actions.accept", "Accept"),
      decline: t("instructorRequestsPage.actions.decline", "Decline"),
      statusFallback: t(
        "instructorRequestsPage.status.unknown",
        "Unknown"
      ),
    }),
    [t]
  );

  const formatRequest = useCallback(
    (booking) => {
      if (!booking) return null;
      const rawName =
        booking.student_name ||
        booking.student_id ||
        t("instructorRequestsPage.misc.studentFallback", "Student");
      const initial = rawName?.trim?.()?.charAt(0)?.toUpperCase() || "S";
      const status = String(booking.status || "pending").toLowerCase();

      return {
        id: booking.id,
        student: {
          id: booking.student_id,
          name: rawName,
          avatar: buildAvatarUrl(booking.student_avatar_url, initial),
        },
        subject:
          booking.notes ||
          booking.class_title ||
          t("instructorRequestsPage.misc.subjectFallback", "—"),
        date: booking.start_time
          ? new Date(booking.start_time).toLocaleString()
          : "",
        status,
        statusLabel: statusLabels[status] || statusLabels.unknown,
      };
    },
    [statusLabels, t]
  );

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      try {
        const data = await fetchInstructorBookings();
        if (!isMounted) return;
        const formatted = (data || [])
          .map(formatRequest)
          .filter(Boolean);
        setRequests(formatted);
      } catch (err) {
        console.error("Failed to load requests", err);
        if (isMounted) {
          setRequests([]);
        }
      }
    };

    loadRequests();
    return () => {
      isMounted = false;
    };
  }, [formatRequest]);

  const handleStatusChange = (id, newStatus) => {
    const normalizedStatus = String(newStatus || "").toLowerCase();
    updateInstructorBooking(id, { status: newStatus })
      .then(() => {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: normalizedStatus,
                  statusLabel:
                    statusLabels[normalizedStatus] || statusLabels.unknown,
                }
              : r
          )
        );
      })
      .catch((err) => {
        console.error("Status update failed", err);
      });
  };

  const filtered =
    activeTab === "all"
      ? requests
      : requests.filter((r) => r.status === activeTab);

  return (
    <InstructorLayout>
      <section className="py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">
          {t("instructorRequestsPage.title", "Booking Requests")}
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.value}
              className={`px-4 py-2 rounded-full text-sm font-medium border ${
                activeTab === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Request Grid */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-gray-500">
              {t(
                "instructorRequestsPage.empty",
                "No requests in this category."
              )}
            </p>
          ) : (
            filtered.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                labels={actionLabels}
                onAccept={() => handleStatusChange(req.id, "approved")}
                onDecline={() => handleStatusChange(req.id, "declined")}
                onChat={() => {
                  if (!req.student?.id || typeof window === "undefined") {
                    return;
                  }
                  window.location.href = `/messages?userId=${req.student.id}`;
                }}
              />
            ))
          )}
        </div>
      </section>
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale = "en" }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard", "common"],
        nextI18NextConfig
      )),
    },
  };
}
