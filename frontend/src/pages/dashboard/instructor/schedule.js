import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import CalendarView from "@/components/shared/CalendarView";
import { fetchInstructorScheduleEvents } from "@/services/instructor/classService";
import useScheduleStore from "@/store/schedule/scheduleStore";
import { getLessonRoomLink } from "@/services/lessonService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";
import { addMinutes, differenceInMinutes, format, formatDistanceToNow, isAfter, isBefore, isWithinInterval } from "date-fns";

export default function InstructorSchedule() {
  const { t } = useTranslation(["dashboard", "common"], { keyPrefix: "schedulePage" });
  const { events, clear, addEvents, prunePastEvents } = useScheduleStore();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventFilter, setEventFilter] = useState("all");
  const [joiningLessonId, setJoiningLessonId] = useState(null);

  const resolveEventType = useCallback((event) => {
    if (!event) return undefined;
    const type = event.extendedProps?.type;
    if (type) return type;
    if (typeof event.id === "string") {
      if (event.id.startsWith("lesson-")) return "lesson";
      if (event.id.startsWith("class-")) return "class";
    }
    return undefined;
  }, []);

  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchInstructorScheduleEvents();
      clear();
      addEvents(data);
      prunePastEvents();
    } catch (err) {
      console.error("Failed to load schedule", err);
    } finally {
      setLoading(false);
    }
  }, [addEvents, clear, prunePastEvents]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    if (!events.length) {
      setSelectedEventId(null);
      return;
    }
    setSelectedEventId((prev) => {
      if (prev && events.some((event) => event.id === prev)) {
        return prev;
      }
      return events[0].id;
    });
  }, [events]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const filteredEvents = useMemo(() => {
    if (eventFilter === "all") return events;
    return events.filter((event) => resolveEventType(event) === eventFilter);
  }, [events, eventFilter, resolveEventType]);

  const lessonsCount = useMemo(
    () => events.filter((event) => resolveEventType(event) === "lesson").length,
    [events, resolveEventType]
  );

  useEffect(() => {
    if (eventFilter === "all") return;
    if (!filteredEvents.length) {
      setSelectedEventId(null);
      return;
    }
    if (!filteredEvents.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(filteredEvents[0].id);
    }
  }, [eventFilter, filteredEvents, selectedEventId]);

  const nextEvent = events.length > 0 ? events[0] : null;

  const buildEventTiming = useCallback((event) => {
    if (!event?.start) return null;
    const start = new Date(event.start);
    if (Number.isNaN(start.getTime())) return null;

    let end = null;
    if (event.end) {
      const parsed = new Date(event.end);
      if (!Number.isNaN(parsed.getTime())) {
        end = parsed;
      }
    }

    if (!end) {
      const fallbackDuration =
        event.extendedProps?.durationMinutes && Number.isFinite(event.extendedProps.durationMinutes)
          ? event.extendedProps.durationMinutes
          : 60;
      end = addMinutes(start, fallbackDuration);
    }

    const now = new Date();
    let status = "upcoming";
    if (isWithinInterval(now, { start, end })) {
      status = "live";
    } else if (isBefore(now, start)) {
      status = "upcoming";
    } else if (isAfter(now, end)) {
      status = "completed";
    }

    const duration = Math.max(differenceInMinutes(end, start), 0);

    return {
      start,
      end,
      status,
      duration,
      relative: formatDistanceToNow(start, { addSuffix: true }),
    };
  }, []);

  const selectedTiming = useMemo(() => buildEventTiming(selectedEvent), [buildEventTiming, selectedEvent]);
  const nextTiming = useMemo(() => buildEventTiming(nextEvent), [buildEventTiming, nextEvent]);

  const tryJoinLesson = useCallback(
    async (lessonId) => {
      if (!lessonId) return;
      try {
        setJoiningLessonId(lessonId);
        const url = await getLessonRoomLink(lessonId);
        window.open(url, "_blank");
      } catch (err) {
        console.error(err);
        alert(t("failed_live_session", { ns: "common" }));
      } finally {
        setJoiningLessonId(null);
      }
    },
    [t]
  );

  const handleEventClick = useCallback(
    async (info) => {
      const eventApi = info?.event;
      if (!eventApi) return;
      const eventId = eventApi.id;
      setSelectedEventId(eventId);

      const current = events.find((evt) => evt.id === eventId);
      if (!current) return;

      const type = resolveEventType(current);

      if (type === "lesson") {
        const timing = buildEventTiming(current);
        if (timing?.status === "live") {
          await tryJoinLesson(current.extendedProps.lessonId);
        }
        return;
      }

      if (type === "class") {
        router.prefetch(`/dashboard/instructor/online-classes/${current.extendedProps.classId}`).catch(() => {});
      }
    },
    [buildEventTiming, events, resolveEventType, router, tryJoinLesson]
  );

  const renderEventContent = useCallback(
    (arg) => {
      const type = resolveEventType(arg.event);
      const label =
        type === "lesson"
          ? t("lesson_label")
          : type === "class"
          ? t("class_label")
          : t("event_label");
      return (
        <div className="flex flex-col space-y-1 rounded-md bg-white/10 p-1">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide ${
              type === "lesson" ? "text-emerald-200" : "text-indigo-200"
            }`}
          >
            {label}
          </span>
          <span className="text-xs text-white">{arg.timeText}</span>
          <span className="text-sm font-semibold leading-tight text-white">
            {arg.event.extendedProps?.displayTitle || arg.event.title}
          </span>
        </div>
      );
    },
    [resolveEventType, t]
  );

  const selectedType = resolveEventType(selectedEvent);
  const selectedIsLesson = selectedType === "lesson";
  const selectedIsClass = selectedType === "class";
  const canJoinSelectedLesson =
    selectedIsLesson &&
    selectedTiming?.status === "live" &&
    selectedEvent?.extendedProps?.lessonId &&
    joiningLessonId !== selectedEvent.extendedProps.lessonId;

  const canViewClassroom =
    selectedEvent?.extendedProps?.classId &&
    (selectedIsClass || selectedIsLesson);

  return (
    <InstructorLayout>
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-yellow-500/30 blur-3xl" />
            <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="relative px-8 py-7">
              <p className="text-sm uppercase tracking-wide text-gray-300">{t("overview_heading")}</p>
              <h1 className="mt-1 text-3xl font-bold">{t("title")}</h1>
              {nextEvent && nextTiming ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-gray-300">{t("next_event")}</p>
                  <p className="mt-1 text-lg font-semibold">
                    {nextEvent.extendedProps?.displayTitle || nextEvent.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-200">
                    {format(nextTiming.start, "EEE, MMM d • h:mm a")} · {nextTiming.relative}
                  </p>
                  {nextEvent.extendedProps?.classTitle && (
                    <p className="mt-1 text-xs text-gray-400">
                      {t("class_ref")}: {nextEvent.extendedProps.classTitle}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-200 max-w-md">{t("overview_empty")}</p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={loadSchedule}
                  disabled={loading}
                  className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-semibold text-gray-900 shadow-lg transition hover:bg-yellow-300 disabled:opacity-70"
                >
                  {loading ? t("refreshing") : t("refresh")}
                </button>
                {canJoinSelectedLesson && (
                  <button
                    onClick={() => tryJoinLesson(selectedEvent.extendedProps.lessonId)}
                    className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-400"
                  >
                    {t("join_live")}
                  </button>
                )}
                {canViewClassroom && (
                  <button
                    onClick={() =>
                      router.push(`/dashboard/instructor/online-classes/${selectedEvent.extendedProps.classId}`)
                    }
                    className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                  >
                    {t("open_class")}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{t("filters_title")}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "all", label: t("filter_all") },
                { id: "class", label: t("filter_classes") },
                { id: "lesson", label: t("filter_lessons") },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setEventFilter(filter.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    eventFilter === filter.id
                      ? "bg-gray-900 text-white shadow"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-gray-500">
              <div className="rounded-2xl bg-gray-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">{t("total_events")}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{events.length}</p>
              </div>
              <div className="rounded-2xl bg-gray-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">{t("lessons_count")}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{lessonsCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <CalendarView
              title={t("calendar_title")}
              subtitle={t("calendar_subtitle")}
              events={filteredEvents}
              onEventClick={handleEventClick}
              eventContent={renderEventContent}
            />
            {loading && (
              <p className="text-center text-sm text-gray-500">{t("loading", { ns: "common" })}</p>
            )}
            {!loading && filteredEvents.length === 0 && (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm">
                <p className="text-lg font-semibold text-gray-700">{t("no_events_title")}</p>
                <p className="mt-2 text-sm text-gray-500">{t("no_events")}</p>
              </div>
            )}
          </div>

          <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
            {selectedEvent ? (
              <>
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  {selectedIsLesson ? t("lesson_label") : t("class_label")}
                  {selectedTiming && (
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        selectedTiming.status === "live"
                          ? "bg-emerald-100 text-emerald-700"
                          : selectedTiming.status === "completed"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {t(`status.${selectedTiming.status}`)}
                    </span>
                  )}
                </span>
                <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                  {selectedEvent.extendedProps?.displayTitle || selectedEvent.title}
                </h2>
                {selectedEvent.extendedProps?.classTitle && selectedIsLesson && (
                  <p className="mt-1 text-sm text-gray-500">
                    {t("part_of_class")}{" "}
                    <span className="font-medium text-gray-900">
                      {selectedEvent.extendedProps.classTitle}
                    </span>
                  </p>
                )}

                {selectedTiming && (
                  <dl className="mt-5 space-y-3 text-sm text-gray-600">
                    <div>
                      <dt className="font-medium text-gray-500 uppercase tracking-wide text-xs">
                        {t("starts")}
                      </dt>
                      <dd className="text-gray-800">
                        {format(selectedTiming.start, "EEEE, MMM d · h:mm a")}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500 uppercase tracking-wide text-xs">
                        {t("ends")}
                      </dt>
                      <dd className="text-gray-800">
                        {format(selectedTiming.end, "EEEE, MMM d · h:mm a")}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500 uppercase tracking-wide text-xs">
                        {t("duration")}
                      </dt>
                      <dd className="text-gray-800">{t("minutes", { count: selectedTiming.duration })}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500 uppercase tracking-wide text-xs">
                        {t("relative_time")}
                      </dt>
                      <dd className="text-gray-800">{selectedTiming.relative}</dd>
                    </div>
                    {typeof selectedEvent.extendedProps?.enrolledCount === "number" && (
                      <div>
                        <dt className="font-medium text-gray-500 uppercase tracking-wide text-xs">
                          {t("enrolled")}
                        </dt>
                        <dd className="text-gray-800">
                          {selectedEvent.extendedProps.enrolledCount}
                          {selectedEvent.extendedProps?.maxStudents
                            ? ` / ${selectedEvent.extendedProps.maxStudents}`
                            : ""}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}

                <div className="mt-6 space-y-2">
                  {selectedIsLesson && (
                    <button
                      onClick={() => tryJoinLesson(selectedEvent.extendedProps?.lessonId)}
                      disabled={!selectedEvent.extendedProps?.lessonId || joiningLessonId === selectedEvent.extendedProps?.lessonId}
                      className="w-full rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {joiningLessonId === selectedEvent.extendedProps?.lessonId
                        ? t("joining")
                        : t("join_live")}
                    </button>
                  )}
                  {canViewClassroom && (
                    <button
                      onClick={() =>
                        router.push(`/dashboard/instructor/online-classes/${selectedEvent.extendedProps?.classId}`)
                      }
                      className="w-full rounded-xl border border-gray-300 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                    >
                      {t("open_class")}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
                <p className="text-lg font-semibold text-gray-700">{t("no_selection_title")}</p>
                <p className="mt-2 text-sm text-gray-500">{t("no_selection_hint")}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard", "common"], nextI18NextConfig)),
    },
  };
}
