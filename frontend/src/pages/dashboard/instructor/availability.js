import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import { v4 as uuidv4 } from 'uuid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import { Dialog } from '@headlessui/react';
import ConfirmModal from '@/components/common/ConfirmModal';
import WarningModal from '@/components/common/WarningModal';
import useAuthStore from '@/store/auth/authStore';
import {
  toggleInstructorStatus,
  getInstructorAvailability,
  updateInstructorAvailability,
} from '@/services/instructor/instructorService';
import { toast } from 'react-toastify';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../next-i18next.config.js';
import {
  FaCalendarPlus,
  FaClock,
  FaInfoCircle,
  FaToggleOff,
  FaToggleOn,
  FaTrashAlt,
} from 'react-icons/fa';

const FullCalendar = dynamic(() => import('@/components/shared/FullCalendarClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white text-sm text-gray-500">
      Loading calendar…
    </div>
  ),
});

const defaultCategory = 'Available';

const categoryPalette = {
  'Available': '#8b5cf6',
  'Consultation': '#f59e0b',
  'Q&A': '#3b82f6',
  'Office Hour': '#10b981',
};

const dayOptions = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const ensureSeconds = (time = '') => {
  if (!time) return '00:00:00';
  return time.length === 5 ? `${time}:00` : time;
};

const normalizeDays = (days = []) =>
  [...new Set(days.map((day) => Number(day)))]
    .filter((day) => !Number.isNaN(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);

const timeToDate = (time) => new Date(`1970-01-01T${ensureSeconds(time)}`);

const timesOverlap = (slotA, slotB) => {
  const startA = timeToDate(slotA.startTime);
  const endA = timeToDate(slotA.endTime);
  const startB = timeToDate(slotB.startTime);
  const endB = timeToDate(slotB.endTime);
  return startA < endB && endA > startB;
};

const sanitizeSlot = (slot) => {
  const title = slot.title || defaultCategory;
  const color = categoryPalette[title] || categoryPalette[defaultCategory];
  return {
    id: slot.id || uuidv4(),
    title,
    daysOfWeek: normalizeDays(slot.daysOfWeek),
    startTime: ensureSeconds(slot.startTime),
    endTime: ensureSeconds(slot.endTime),
    startRecur: slot.startRecur || null,
    endRecur: slot.endRecur || null,
    backgroundColor: slot.backgroundColor || color,
    borderColor: slot.borderColor || color,
  };
};

const formatDateLabel = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const buildSlotSummary = (slot) => {
  const days = normalizeDays(slot.daysOfWeek);
  const dayLabel = days.length
    ? days.map((day) => dayOptions.find((option) => option.value === day)?.short ?? day).join(', ')
    : 'Any day';

  const start = (slot.startTime || '').slice(0, 5) || '--:--';
  const end = (slot.endTime || '').slice(0, 5) || '--:--';
  const timeLabel = `${start} – ${end}`;

  const startLabel = formatDateLabel(slot.startRecur);
  const endLabel = formatDateLabel(slot.endRecur);

  let dateLabel = 'Repeats weekly';
  if (startLabel && endLabel) {
    dateLabel = `${startLabel} → ${endLabel}`;
  } else if (startLabel) {
    dateLabel = `Starting ${startLabel}`;
  } else if (endLabel) {
    dateLabel = `Until ${endLabel}`;
  }

  return { dayLabel, timeLabel, dateLabel };
};

export default function InstructorAvailabilityPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const initialDate = new Date();
  const initialDateIso = initialDate.toISOString().split('T')[0];
  const initialDay = initialDate.getDay();

  const [available, setAvailable] = useState(user?.is_online ?? false);
  const [availability, setAvailability] = useState([]);
  const [initialAvailability, setInitialAvailability] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [slotStartDate, setSlotStartDate] = useState(initialDateIso);
  const [slotEndDate, setSlotEndDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('10:00');
  const [selectedDays, setSelectedDays] = useState([initialDay]);

  const [warningModal, setWarningModal] = useState({ open: false, message: '' });
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const calendarRef = useRef(null);
  const [calendarReady, setCalendarReady] = useState(false);
  const [isCompactView, setIsCompactView] = useState(false);
  const handleCalendarRef = useCallback((instance) => {
    calendarRef.current = instance;
    const isReady = Boolean(instance && typeof instance.getApi === 'function');
    setCalendarReady(isReady);
  }, []);

  useEffect(() => {
    setAvailable(user?.is_online ?? false);
  }, [user]);

  useEffect(() => {
    const loadAvailability = async () => {
      setLoading(true);
      try {
        const res = await getInstructorAvailability();
        const slots = Array.isArray(res?.availability_slots) ? res.availability_slots : [];
        const sanitized = slots.map(sanitizeSlot);
        setAvailability(sanitized);
        setInitialAvailability(sanitized.map((slot) => ({ ...slot, daysOfWeek: [...slot.daysOfWeek] })));
      } catch (error) {
        console.error('Failed to load availability', error);
        toast.error('Unable to load your availability.');
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const updateCompactView = () => {
      setIsCompactView(window.innerWidth < 1024);
    };

    updateCompactView();
    window.addEventListener('resize', updateCompactView);

    return () => window.removeEventListener('resize', updateCompactView);
  }, []);

  useEffect(() => {
    if (loading || !calendarReady) return;
    const calendarInstance = calendarRef.current;
    if (!calendarInstance || typeof calendarInstance.getApi !== 'function') return;
    const calendarApi = calendarInstance.getApi();

    const targetView = isCompactView ? 'timeGridDay' : 'timeGridWeek';
    if (calendarApi.view.type !== targetView) {
      calendarApi.changeView(targetView);
    }
  }, [calendarReady, isCompactView, loading]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(initialAvailability) !== JSON.stringify(availability);
  }, [initialAvailability, availability]);

  const resetSlotForm = () => {
    const today = new Date();
    setSelectedCategory(defaultCategory);
    setSlotStartDate(today.toISOString().split('T')[0]);
    setSlotEndDate('');
    setSlotStartTime('09:00');
    setSlotEndTime('10:00');
    setSelectedDays([today.getDay()]);
  };

  const openSlotModal = (startDate, startTime, endTime, days) => {
    setSlotStartDate(startDate);
    setSlotEndDate('');
    setSlotStartTime(startTime);
    setSlotEndTime(endTime);
    setSelectedDays(days);
    setSelectedCategory(defaultCategory);
    setIsModalOpen(true);
  };

  const handleSlotSelect = (selectionInfo) => {
    const start = selectionInfo.start;
    const end = selectionInfo.end ?? new Date(selectionInfo.start.getTime() + 60 * 60 * 1000);
    const startDate = selectionInfo.startStr.split('T')[0];
    const startTime = start.toTimeString().slice(0, 5);
    const endTime = end.toTimeString().slice(0, 5);
    const day = start.getDay();

    openSlotModal(startDate, startTime, endTime, [day]);
    selectionInfo.view.calendar.unselect();
  };

  const toCandidateSlot = () => ({
    id: uuidv4(),
    title: selectedCategory,
    daysOfWeek: normalizeDays(selectedDays),
    startTime: ensureSeconds(slotStartTime),
    endTime: ensureSeconds(slotEndTime),
    startRecur: slotStartDate || null,
    endRecur: slotEndDate || null,
    backgroundColor: categoryPalette[selectedCategory] || categoryPalette[defaultCategory],
    borderColor: categoryPalette[selectedCategory] || categoryPalette[defaultCategory],
  });

  const promptRemoveSlot = (slotId) => {
    setConfirmModal({
      open: true,
      message: 'Remove this availability slot?',
      onConfirm: () => {
        setAvailability((prev) => prev.filter((slot) => String(slot.id) !== String(slotId)));
        setConfirmModal({ open: false, message: '', onConfirm: null });
      },
    });
  };

  const handleSlotRemove = (clickInfo) => {
    promptRemoveSlot(clickInfo.event.id);
  };

  const closeWarning = () => setWarningModal({ open: false, message: '' });

  const addSlot = () => {
    if (!slotStartDate) {
      setWarningModal({ open: true, message: 'Please pick a start date for this availability.' });
      return;
    }

    if (!slotStartTime || !slotEndTime) {
      setWarningModal({ open: true, message: 'Please choose start and end times.' });
      return;
    }

    const startDateTime = new Date(`${slotStartDate}T${ensureSeconds(slotStartTime)}`);
    const endDateTime = new Date(`${slotStartDate}T${ensureSeconds(slotEndTime)}`);

    if (!(endDateTime > startDateTime)) {
      setWarningModal({ open: true, message: 'End time must be after the start time.' });
      return;
    }

    if (slotEndDate && slotStartDate) {
      const startDate = new Date(slotStartDate);
      const endDate = new Date(slotEndDate);
      if (endDate < startDate) {
        setWarningModal({ open: true, message: 'End date cannot be earlier than the start date.' });
        return;
      }
    }

    const days = normalizeDays(selectedDays);
    if (!days.length) {
      setWarningModal({ open: true, message: 'Select at least one day of the week.' });
      return;
    }

    const candidate = toCandidateSlot();

    const overlaps = availability.some((slot) => {
      const slotDays = normalizeDays(slot.daysOfWeek);
      const shareDay = slotDays.some((day) => days.includes(day));
      if (!shareDay) return false;
      return timesOverlap(slot, candidate);
    });

    if (overlaps) {
      setWarningModal({ open: true, message: 'This slot overlaps with an existing availability.' });
      return;
    }

    setAvailability((prev) => [...prev, candidate]);
    setIsModalOpen(false);
    resetSlotForm();
  };

  const handleStatusToggle = async () => {
    const newStatus = !available;
    try {
      const response = await toggleInstructorStatus(newStatus);
      const resolved = response?.is_online ?? newStatus;
      setAvailable(resolved);
      setUser({ ...user, is_online: resolved });
      toast.success(resolved ? t('available_now') : t('unavailable_now'));
    } catch (error) {
      console.error('Failed to toggle availability', error);
      toast.error(t('availability_update_failed'));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateInstructorAvailability(availability);
      setInitialAvailability(availability.map((slot) => ({ ...slot, daysOfWeek: [...slot.daysOfWeek] })));
      toast.success('Availability saved');
    } catch (error) {
      console.error('Failed to save availability', error);
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setAvailability(initialAvailability.map((slot) => ({ ...slot, daysOfWeek: [...slot.daysOfWeek] })));
  };

  const calendarToolbar = useMemo(() => {
    if (isCompactView) {
      return { left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek' };
    }
    return { left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' };
  }, [isCompactView]);

  const slotDuration = isCompactView ? '00:30:00' : '01:00:00';

  const renderDayHeader = useCallback((args) => {
    const weekday = args.date.toLocaleDateString(undefined, { weekday: 'short' });
    const day = args.date.getDate();
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">{weekday}</span>
        <span className="text-base font-semibold text-gray-900">{day}</span>
      </div>
    );
  }, []);

  const renderEventContent = useCallback((eventInfo) => {
    const category = eventInfo.event.title || defaultCategory;
    const color = categoryPalette[category] || categoryPalette[defaultCategory];
    return (
      <div
        className="flex h-full w-full flex-col justify-center rounded-lg px-2 py-1 text-[11px] font-semibold leading-tight text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        <span>{category}</span>
        <span className="text-[10px] font-medium text-white/80">{eventInfo.timeText}</span>
      </div>
    );
  }, []);

  const handleEventDidMount = useCallback((info) => {
    if (info.el) {
      info.el.style.backgroundColor = 'transparent';
      info.el.style.borderColor = 'transparent';
      info.el.style.padding = '0';
    }

    if (!info.event.start) return;
    const startLabel = info.event.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const endLabel = info.event.end
      ? info.event.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : '';
    const label = endLabel ? `${startLabel} - ${endLabel}` : startLabel;
    info.el?.setAttribute('title', `${info.event.title || defaultCategory} | ${label}`);
  }, []);

  const slotSummaries = useMemo(() => {
    return availability
      .map((slot) => ({ slot, summary: buildSlotSummary(slot) }))
      .sort((a, b) => {
        const dayA = normalizeDays(a.slot.daysOfWeek)[0] ?? 0;
        const dayB = normalizeDays(b.slot.daysOfWeek)[0] ?? 0;
        return dayA - dayB || a.slot.startTime.localeCompare(b.slot.startTime);
      });
  }, [availability]);

  const todayIso = new Date().toISOString().split('T')[0];

  return (
    <InstructorLayout>
      <section className="space-y-8 p-4 lg:p-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Availability &amp; Status</h1>
              <p className="mt-1 text-sm text-gray-600">
                Control when students can request lessons. Toggle your global status or define specific weekly time slots.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStatusToggle}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                available
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  : 'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {available ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
              {available ? 'Currently Available' : 'Currently Unavailable'}
            </button>
          </div>
          <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
            <FaInfoCircle className="mt-0.5 text-yellow-500" />
            <p>
              When you are marked unavailable, students cannot send new booking requests even if time slots exist. Set weekly slots below to restrict when students can book you while you are online.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Weekly schedule</h2>
                <p className="text-sm text-gray-500">Select time blocks on the calendar or add them manually.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const defaultDate = new Date();
                  openSlotModal(defaultDate.toISOString().split('T')[0], '09:00', '10:00', [defaultDate.getDay()]);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
              >
                <FaCalendarPlus />
                Add availability
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50 via-white to-white shadow-inner">
              {loading ? (
                <div className="flex h-80 items-center justify-center text-sm font-medium text-gray-500">Loading calendar...</div>
              ) : (
                <FullCalendar
                  ref={handleCalendarRef}
                  plugins={[timeGridPlugin, interactionPlugin]}
                  initialView={isCompactView ? 'timeGridDay' : 'timeGridWeek'}
                  selectable
                  select={handleSlotSelect}
                  events={availability}
                  eventClick={handleSlotRemove}
                  height="auto"
                  slotDuration={slotDuration}
                  slotLabelFormat={{ hour: 'numeric', minute: '2-digit', hour12: false }}
                  eventTimeFormat={{ hour: 'numeric', minute: '2-digit', hour12: false }}
                  slotMinTime="06:00:00"
                  slotMaxTime="22:00:00"
                  headerToolbar={calendarToolbar}
                  dayHeaderContent={renderDayHeader}
                  eventContent={renderEventContent}
                  eventDidMount={handleEventDidMount}
                  eventOverlap={false}
                  selectOverlap={false}
                  firstDay={1}
                  expandRows
                  nowIndicator
                  handleWindowResize
                  stickyHeaderDates
                />
              )}
            </div>
            {isCompactView && (
              <p className="mt-2 text-xs text-gray-500">
                You are viewing a single day calendar on smaller screens. Use the view toggle above to switch back to a weekly view when needed.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <div className="text-sm text-gray-500">
                {hasChanges ? 'You have unsaved changes.' : 'All changes saved.'}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasChanges || loading}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              <FaInfoCircle className="mt-0.5" />
              <div>
                <p className="font-semibold">How availability works</p>
                <p>
                  Turn yourself online when you are ready to accept requests. Add recurring weekly slots to limit bookings to specific times. Students can still request any time if no slots exist while you are online.
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Configured slots</h3>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{availability.length}</span>
              </div>

              <div className="mt-3 space-y-3">
                {availability.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                    No slots yet. Select a range on the calendar or use “Add availability” to create your first slot.
                  </p>
                ) : (
                  slotSummaries.map(({ slot, summary }) => (
                    <div
                      key={slot.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{slot.title}</p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                          <FaClock className="text-gray-400" />
                          <span>{summary.dayLabel}</span>
                          <span>•</span>
                          <span>{summary.timeLabel}</span>
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{summary.dateLabel}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => promptRemoveSlot(slot.id)}
                        className="rounded-full p-2 text-sm text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
                        aria-label="Remove slot"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700">Legend</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {Object.entries(categoryPalette).map(([label, color]) => (
                  <span key={label} className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color }}></span>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} as={Fragment}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <Dialog.Panel className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <Dialog.Title className="text-xl font-semibold text-gray-900">Add availability</Dialog.Title>
              <p className="mt-1 text-sm text-gray-600">Select the days and times you’re available for recurring sessions.</p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {Object.keys(categoryPalette).map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Start date</label>
                    <input
                      type="date"
                      value={slotStartDate}
                      min={todayIso}
                      onChange={(event) => setSlotStartDate(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">End date (optional)</label>
                    <input
                      type="date"
                      value={slotEndDate}
                      min={slotStartDate || todayIso}
                      onChange={(event) => setSlotEndDate(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Start time</label>
                    <input
                      type="time"
                      value={slotStartTime}
                      onChange={(event) => setSlotStartTime(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">End time</label>
                    <input
                      type="time"
                      value={slotEndTime}
                      min={slotStartTime}
                      onChange={(event) => setSlotEndTime(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Days of the week</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {dayOptions.map((day) => {
                      const active = selectedDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            setSelectedDays((prev) =>
                              prev.includes(day.value)
                                ? prev.filter((d) => d !== day.value)
                                : [...prev, day.value]
                            );
                          }}
                          className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                            active
                              ? 'bg-indigo-600 text-white shadow'
                              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {day.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetSlotForm();
                  }}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addSlot}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Add slot
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        <ConfirmModal
          isOpen={confirmModal.open}
          message={confirmModal.message}
          onClose={() => setConfirmModal({ open: false, message: '', onConfirm: null })}
          onConfirm={confirmModal.onConfirm}
        />

        <WarningModal
          isOpen={warningModal.open}
          message={warningModal.message}
          onClose={closeWarning}
        />
      </section>
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard', 'common'], nextI18NextConfig)),
    },
  };
}
