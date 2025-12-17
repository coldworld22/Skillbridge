import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaCalendarCheck, FaClock, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";

import useAuthStore from "@/store/auth/authStore";

import {
  createStudentBooking,
  fetchStudentBookings,
} from "@/services/student/bookingService";
import { fetchInstructorAvailability } from "@/services/public/instructorService";

const DEFAULT_DURATION = 60;
const DURATION_OPTIONS = [30, 45, 60, 90];
const MAX_AUTO_LOOKAHEAD_DAYS = 90;

const pad = (value) => value.toString().padStart(2, "0");

const toInputValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;

const addMinutes = (value, minutes) => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return toInputValue(date);
};

const normalizeRecurStart = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeRecurEnd = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // Treat date-only values as inclusive through the end of that day
  if (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  ) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

const getSlotWindowForDate = (slot, baseDate) => {
  const [startHour, startMinute] = slot.startTime.split(":").map(Number);
  const [endHour, endMinute] = slot.endTime.split(":").map(Number);
  const windowStart = new Date(baseDate);
  windowStart.setHours(startHour, startMinute, 0, 0);
  const windowEnd = new Date(baseDate);
  windowEnd.setHours(endHour, endMinute, 0, 0);
  return { windowStart, windowEnd };
};

const getNextAvailableSlot = (slots, durationMinutes, fromDate = new Date()) => {
  if (!Array.isArray(slots) || !slots.length) return null;
  const duration = Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : DEFAULT_DURATION;
  const durationMs = duration * 60 * 1000;
  const searchStart = new Date(fromDate);

  for (let dayOffset = 0; dayOffset <= MAX_AUTO_LOOKAHEAD_DAYS; dayOffset += 1) {
    const dayCandidate = new Date(searchStart);
    dayCandidate.setHours(0, 0, 0, 0);
    dayCandidate.setDate(dayCandidate.getDate() + dayOffset);

    for (const slot of slots) {
      if (!slot?.daysOfWeek || !slot.startTime || !slot.endTime) continue;

      const slotDays = slot.daysOfWeek.map(Number).filter((day) => Number.isInteger(day));
      if (!slotDays.includes(dayCandidate.getDay())) continue;

      const { windowStart, windowEnd } = getSlotWindowForDate(slot, dayCandidate);
      if (windowEnd <= windowStart) continue;

      const startRecur = normalizeRecurStart(slot.startRecur);
      const endRecur = normalizeRecurEnd(slot.endRecur);

      if (startRecur && windowEnd < startRecur) continue;
      if (endRecur && windowStart > endRecur) continue;

      let candidateStart =
        dayOffset === 0
          ? new Date(Math.max(searchStart.getTime(), windowStart.getTime()))
          : new Date(windowStart);
      candidateStart.setSeconds(0, 0);
      if (candidateStart < windowStart) {
        candidateStart = new Date(windowStart);
      }

      const latestPossibleStart = new Date(windowEnd.getTime() - durationMs);
      if (candidateStart > latestPossibleStart) continue;

      if (startRecur && candidateStart < startRecur) {
        const adjustedStart = new Date(Math.max(startRecur.getTime(), windowStart.getTime()));
        if (adjustedStart > latestPossibleStart) continue;
        candidateStart = adjustedStart;
      }

      const candidateEnd = new Date(candidateStart.getTime() + durationMs);
      if (candidateEnd > windowEnd) continue;
      if (endRecur && candidateEnd > endRecur) continue;

      return { start: candidateStart, end: candidateEnd };
    }
  }

  return null;
};

const getSuggestedSlots = (slots, durationMinutes, count = 4, fromDate = new Date()) => {
  const suggestions = [];
  let cursor = new Date(fromDate);
  for (let i = 0; i < count; i += 1) {
    const slot = getNextAvailableSlot(slots, durationMinutes, cursor);
    if (!slot) break;
    suggestions.push(slot);
    cursor = new Date(slot.end.getTime() + 60 * 1000);
  }
  return suggestions;
};

const normalizeAvailabilitySlot = (slot) => {
  if (!slot || typeof slot !== "object") return null;
  const days =
    slot.daysOfWeek ??
    slot.days_of_week ??
    slot.days ??
    slot.dow ??
    [];
  const startTime = slot.startTime ?? slot.start_time;
  const endTime = slot.endTime ?? slot.end_time;
  const startRecur = slot.startRecur ?? slot.start_recur ?? slot.startDate ?? slot.start_date;
  const endRecur = slot.endRecur ?? slot.end_recur ?? slot.endDate ?? slot.end_date;

  const daysOfWeek = Array.isArray(days)
    ? days
        .map((value) => {
          const number = Number(value);
          return Number.isInteger(number) ? number : null;
        })
        .filter((value) => value !== null && value >= 0 && value <= 6)
    : [];

  if (!startTime || !endTime || !daysOfWeek.length) {
    return null;
  }

  return {
    ...slot,
    daysOfWeek,
    startTime,
    endTime,
    startRecur,
    endRecur,
  };
};

const formatTimeLabel = (value) => {
  if (typeof value !== "string" || !value) return "";
  const [hoursRaw = "", minutesRaw = ""] = value.split(":");
  if (!hoursRaw && !minutesRaw) return "";
  const hours = hoursRaw.padStart(2, "0").slice(0, 2);
  const minutes = minutesRaw.padStart(2, "0").slice(0, 2);
  return `${hours}:${minutes}`;
};

const formatSlot = (slot) => {
  if (!slot?.daysOfWeek || !slot?.startTime || !slot?.endTime) return null;
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = slot.daysOfWeek
    .map((day) => dayNames[day] ?? day)
    .join(", ");
  const start = formatTimeLabel(slot.startTime);
  const end = formatTimeLabel(slot.endTime);
  if (!start || !end) {
    return `${days}`;
  }
  return `${days} · ${start} – ${end}`;
};

const formatSlotRange = (slot) => {
  const start = normalizeRecurStart(slot?.startRecur);
  const end = normalizeRecurEnd(slot?.endRecur);
  if (!start && !end) return "Repeats weekly";

  const formatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (start && end) {
    return `${formatter.format(start)} → ${formatter.format(end)}`;
  }

  if (start) {
    return `Starting ${formatter.format(start)}`;
  }

  return `Through ${formatter.format(end)}`;
};

export default function BookingRequestModal({ instructor, onClose }) {
  const { user } = useAuthStore();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [sessionType, setSessionType] = useState("Tutorial");
  const [availability, setAvailability] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [hasPending, setHasPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [hasCustomTime, setHasCustomTime] = useState(false);

  const instructorDisplayName = useMemo(
    () => instructor?.name ?? instructor?.full_name ?? instructor?.fullName ?? "this instructor",
    [instructor]
  );

  const instructorAvatar = useMemo(
    () => instructor?.avatar ?? instructor?.avatar_url ?? "/images/profile/user.png",
    [instructor]
  );

  const instructorIsOnline = useMemo(
    () =>
      Boolean(
        instructor?.availableNow ??
          instructor?.is_online ??
          instructor?.isOnline ??
          (typeof instructor?.status === "string" && instructor.status.toLowerCase() === "online")
      ),
    [instructor]
  );

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "student") {
      toast.info("Please login as a student or create a student account to proceed.");
      onClose?.();
    }
  }, [user, onClose]);

  useEffect(() => {
    if (!instructor) return;

    let active = true;

    const now = new Date();
    const initialStart = new Date(now.getTime() + 60 * 60 * 1000);
    setStartTime(toInputValue(initialStart));
    setEndTime(addMinutes(initialStart, DEFAULT_DURATION));
    setDuration(DEFAULT_DURATION);
    setAvailability([]);
    setAvailabilityError("");
    setHasCustomTime(false);
    setHasPending(false);
    setSubmitted(false);
    setSubmitError("");
    setSubmitting(false);

    const loadData = async () => {
      setLoadingAvailability(true);
      const [availabilityResult, bookingsResult] = await Promise.allSettled([
        fetchInstructorAvailability(instructor.id),
        fetchStudentBookings(),
      ]);

      if (!active) {
        return;
      }

      if (availabilityResult.status === "fulfilled") {
        const data = availabilityResult.value;
        const normalized = Array.isArray(data)
          ? data.map(normalizeAvailabilitySlot).filter(Boolean)
          : [];
        setAvailability(normalized);
        if (!normalized.length) {
          setAvailabilityError("");
        }
      } else {
        console.error("Failed to load availability", availabilityResult.reason);
        setAvailability([]);
        setAvailabilityError("Availability details are currently unavailable.");
      }

      if (bookingsResult.status === "fulfilled") {
        const bookings = Array.isArray(bookingsResult.value) ? bookingsResult.value : [];
        const pending = bookings.find(
          (booking) =>
            String(booking.instructor_id) === String(instructor.id) &&
            (booking.status || "").toLowerCase() === "pending"
        );
        if (pending) {
          setHasPending(true);
          toast.info(`You already have a pending request with ${instructorDisplayName}.`);
        } else {
          setHasPending(false);
        }
      } else {
        console.error("Failed to load student bookings", bookingsResult.reason);
        setHasPending(false);
      }

      setLoadingAvailability(false);
    };

    loadData();

    return () => {
      active = false;
    };
  }, [instructor, instructorDisplayName]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (hasCustomTime) return;
    if (!availability.length) return;

    const nextSlot = getNextAvailableSlot(availability, duration);
    if (!nextSlot) return;

    const nextStart = toInputValue(nextSlot.start);
    const nextEnd = toInputValue(nextSlot.end);

    setStartTime((prev) => (prev === nextStart ? prev : nextStart));
    setEndTime((prev) => (prev === nextEnd ? prev : nextEnd));
  }, [availability, duration, hasCustomTime]);

  const checkAvailability = useCallback(
    (start, end) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return { ok: false, reason: 'invalid' };
      }

      if (!instructorIsOnline) {
        return { ok: false, reason: 'offline' };
      }

      if (startDate.toDateString() !== endDate.toDateString()) {
        return { ok: false, reason: 'range' };
      }

      if (!availability.length) {
        return { ok: true };
      }

      const isWithinSchedule = availability.some((slot) => {
        if (!slot?.daysOfWeek || !slot.startTime || !slot.endTime) return false;
        const slotDays = slot.daysOfWeek.map(Number);
        const dayMatches = slotDays.includes(startDate.getDay());
        if (!dayMatches) return false;

        const startRecur = slot.startRecur ? new Date(slot.startRecur) : null;
        const endRecur = slot.endRecur ? new Date(slot.endRecur) : null;
        if (startRecur && startDate < startRecur) return false;
        if (endRecur && startDate > endRecur) return false;

        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        const slotStart = new Date(startDate);
        slotStart.setHours(startHour, startMinute, 0, 0);
        const slotEnd = new Date(startDate);
        slotEnd.setHours(endHour, endMinute, 0, 0);

        return startDate >= slotStart && endDate <= slotEnd;
      });

      return { ok: isWithinSchedule, reason: isWithinSchedule ? undefined : 'schedule' };
    },
    [availability, instructorIsOnline]
  );

  const availabilityWindow = useMemo(() => {
    if (!Array.isArray(availability) || !availability.length) return null;

    let earliest = null;
    let latest = null;

    availability.forEach((slot) => {
      const slotStart = normalizeRecurStart(slot?.startRecur);
      const slotEnd = normalizeRecurEnd(slot?.endRecur);

      if (slotStart && (!earliest || slotStart < earliest)) {
        earliest = slotStart;
      }

      if (slotEnd && (!latest || slotEnd > latest)) {
        latest = slotEnd;
      }
    });

    if (!earliest && !latest) return null;
    return { earliest, latest };
  }, [availability]);

  const availabilitySummary = useMemo(() => {
    if (!instructorIsOnline) {
      return "This instructor is currently offline. Check back once they mark themselves available.";
    }

    if (!availability.length) {
      return "This instructor hasn’t published availability yet. You can still send a request, but it may take longer to confirm.";
    }

    return availability
      .map(formatSlot)
      .filter(Boolean)
      .join(" • ");
  }, [availability, instructorIsOnline]);

  const availabilityWindowText = useMemo(() => {
    if (!availabilityWindow) return "";

    const formatter = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const { earliest, latest } = availabilityWindow;

    if (earliest && latest) {
      return `${formatter.format(earliest)} – ${formatter.format(latest)}`;
    }

    if (earliest) {
      return `starting ${formatter.format(earliest)}`;
    }

    if (latest) {
      return `through ${formatter.format(latest)}`;
    }

    return "";
  }, [availabilityWindow]);

  const availabilityInputHint = useMemo(() => {
    if (!availabilityWindow) return "";

    const formatter = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const { earliest, latest } = availabilityWindow;

    if (earliest && latest) {
      return `between ${formatter.format(earliest)} and ${formatter.format(latest)}`;
    }

    if (earliest) {
      return `on or after ${formatter.format(earliest)}`;
    }

    if (latest) {
      return `on or before ${formatter.format(latest)}`;
    }

    return "";
  }, [availabilityWindow]);

  const availabilityDetails = useMemo(() => {
    if (!availability.length) return [];
    return availability
      .map((slot) => {
        const base = formatSlot(slot);
        if (!base) return null;
        const range = formatSlotRange(slot);
        return range ? `${base} (${range})` : base;
      })
      .filter(Boolean);
  }, [availability]);

  const startTimeMin = useMemo(() => {
    const now = new Date();
    if (!availabilityWindow?.earliest) {
      return toInputValue(now);
    }

    const minDate = availabilityWindow.earliest > now ? availabilityWindow.earliest : now;
    return toInputValue(minDate);
  }, [availabilityWindow]);

  const timeLimitMax = useMemo(() => {
    if (!availabilityWindow?.latest) return undefined;
    const now = new Date();
    if (availabilityWindow.latest < now) return undefined;
    return toInputValue(availabilityWindow.latest);
  }, [availabilityWindow]);

  const suggestedSlots = useMemo(() => {
    if (!instructorIsOnline) return [];
    if (!availability.length) return [];
    return getSuggestedSlots(availability, duration)
      .filter(Boolean)
      .map((slot) => {
        const dateLabel = slot.start.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const timeLabel = `${slot.start.toLocaleTimeString(undefined, {
          timeStyle: "short",
        })} – ${slot.end.toLocaleTimeString(undefined, { timeStyle: "short" })}`;
        return {
          raw: slot,
          dateLabel,
          timeLabel,
        };
      });
  }, [availability, duration, instructorIsOnline]);

  const durationOptions = useMemo(() => {
    const base = new Set(DURATION_OPTIONS);
    if (duration && duration > 0) {
      base.add(duration);
    }
    return Array.from(base).sort((a, b) => a - b);
  }, [duration]);

  const handleStartChange = (value) => {
    setHasCustomTime(true);
    setStartTime(value);
    setSubmitError("");
    if (value) {
      setEndTime(addMinutes(value, duration));
    }
  };

  const handleDurationChange = (minutes) => {
    setHasCustomTime(true);
    setDuration(minutes);
    setSubmitError("");
    if (startTime) {
      setEndTime(addMinutes(startTime, minutes));
    }
  };

  const handleEndChange = (value) => {
    setHasCustomTime(true);
    setEndTime(value);
    setSubmitError("");
    if (startTime && value) {
      const diff = (new Date(value).getTime() - new Date(startTime).getTime()) / 60000;
      if (!Number.isNaN(diff) && diff > 0) {
        setDuration(Math.round(diff));
      }
    }
  };

  const handleSuggestedSlot = (slot) => {
    if (!slot?.raw) return;
    const { start, end } = slot.raw;
    setHasCustomTime(true);
    setSubmitError("");
    setStartTime(toInputValue(start));
    setEndTime(toInputValue(end));
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (Number.isFinite(minutes) && minutes > 0) {
      setDuration(minutes);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (hasPending) return;
    if (!user?.id) {
      setSubmitError("Your session expired. Please sign in again to request a lesson.");
      return;
    }

    const startIso = new Date(startTime).toISOString();
    const endIso = new Date(endTime).toISOString();

    const availabilityCheck = checkAvailability(startIso, endIso);
    if (!availabilityCheck.ok) {
      let message = "The selected time falls outside the instructor's availability. Please choose another slot.";
      if (availabilityCheck.reason === 'offline') {
        message = "This instructor is currently unavailable. Please try again later.";
      } else if (availabilityCheck.reason === 'range') {
        message = "Bookings need to start and end on the same day. Please adjust your times.";
      } else if (availabilityCheck.reason === 'invalid') {
        message = "Please choose a valid start and end time.";
      }
      setSubmitError(message);
      return;
    }

    setSubmitting(true);

    try {
      await createStudentBooking({
        student_id: user.id,
        instructor_id: instructor.id,
        start_time: startIso,
        end_time: endIso,
        notes: notes || `${sessionType} request with ${instructorDisplayName}`,
      });
      toast.success("Lesson request sent!");
      setSubmitted(true);
    } catch (error) {
      console.error("Booking request failed", error);
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0]?.message ||
        error?.message;
      setSubmitError(apiMessage || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={modalStyles.simpleOverlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className={modalStyles.panel}
        style={{ maxWidth: "40rem", position: "relative", borderRadius: "1.5rem" }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={modalStyles.closeButton}
          style={{ position: "absolute", right: "1rem", top: "1rem", background: "#f3f4f6", borderRadius: "9999px", padding: "0.5rem" }}
          aria-label="Close booking modal"
        >
          <FaTimes />
        </button>

        {submitted ? (
          <div className="text-center">
            <h3 className="mb-2 text-2xl font-semibold text-green-600">Request Sent!</h3>
            <p className="mb-4 text-gray-700">
              Your request has been shared with <strong>{instructorDisplayName}</strong>. You’ll receive
              a notification once it’s approved.
            </p>
            <Button
              onClick={onClose}
              variant="accent"
              className="inline-flex items-center justify-center gap-2"
            >
              <FaCalendarCheck /> Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4">
              <img
                src={instructorAvatar}
                alt={instructorDisplayName}
                className="h-16 w-16 rounded-full border border-gray-200 object-cover"
              />
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-gray-900">
                  Request a lesson with {instructorDisplayName}
                </h3>
                <p className="text-sm text-gray-500">
                  Choose a time that suits you. The instructor will confirm or suggest alternatives.
                </p>
              </div>
            </div>

            {availabilitySummary && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-600">
                <span className="mb-2 inline-flex items-center gap-2 font-medium text-gray-700">
                  <FaClock className="text-yellow-500" /> Availability
                </span>
                <p>{availabilitySummary}</p>
                {availabilityWindowText && (
                  <p className="mt-2 text-xs text-gray-500">
                    Accepting booking requests {availabilityWindowText}.
                  </p>
                )}
                {availabilityDetails.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-500">
                    {availabilityDetails.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                )}
                {availabilityError && (
                  <p className="mt-2 text-xs text-rose-500">{availabilityError}</p>
                )}
                {loadingAvailability && (
                  <p className="mt-2 text-xs text-gray-500">Checking availability…</p>
                )}
              </div>
            )}

            {suggestedSlots.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800">Suggested times</p>
                  <span className="text-xs text-gray-500">
                    Pick a slot that best matches your schedule.
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {suggestedSlots.map((slot, index) => (
                    <button
                      key={`${slot.dateLabel}-${slot.timeLabel}-${index}`}
                      type="button"
                      onClick={() => handleSuggestedSlot(slot)}
                      className="flex flex-col rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left transition hover:border-yellow-400 hover:bg-yellow-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1"
                    >
                      <span className="text-xs uppercase tracking-wide text-gray-500">
                        {slot.dateLabel}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {slot.timeLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasPending && (
              <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-center text-sm text-blue-700">
                You already have a pending request with {instructorDisplayName}.
              </p>
            )}

            {submitError && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
                {submitError}
              </p>
            )}

            {!instructorIsOnline && !hasPending && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                {instructorDisplayName} is currently unavailable. You can browse their availability, but you’ll need to wait until they’re online to send a request.
              </p>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Session type</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                value={sessionType}
                onChange={(event) => setSessionType(event.target.value)}
                disabled={hasPending}
              >
                <option value="Tutorial">Tutorial</option>
                <option value="Online Class">Online Class</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Start time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(event) => handleStartChange(event.target.value)}
                  required
                  min={startTimeMin}
                  max={timeLimitMax}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200 disabled:cursor-not-allowed"
                  disabled={hasPending || loadingAvailability}
                />
                {availabilityInputHint && (
                  <p className="mt-1 text-xs text-gray-500">
                    Select a start time {availabilityInputHint}.
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Duration</label>
                <select
                  value={duration}
                  onChange={(event) => handleDurationChange(Number(event.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                  disabled={hasPending}
                >
                  {durationOptions.map((option) => (
                    <option key={option} value={option}>
                      {DURATION_OPTIONS.includes(option)
                        ? `${option} minutes`
                        : `${option} minutes (custom)`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  required
                  min={startTime || undefined}
                  max={timeLimitMax}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200 disabled:cursor-not-allowed"
                  onChange={(event) => handleEndChange(event.target.value)}
                  disabled={hasPending || loadingAvailability}
                />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Additional notes <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Share any goals or context for this session."
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  setSubmitError("");
                }}
                disabled={hasPending}
              />
            </div>

            <div className="flex flex-col gap-2 pt-4 sm:flex-row">
              <Button
                type="button"
                onClick={onClose}
                variant="neutral"
                className="w-full sm:w-1/2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                className="w-full sm:w-1/2"
                disabled={hasPending || submitting || !instructorIsOnline}
              >
                <FaCalendarCheck />
                {submitting ? "Sending…" : "Send Request"}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
