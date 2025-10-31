const { randomUUID } = require("crypto");
const { availabilitySlotSchema } = require("./instructor.validator");

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const extractRawAvailabilitySlots = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw;
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  if (Buffer.isBuffer(raw)) {
    try {
      const parsed = JSON.parse(raw.toString("utf8"));
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  if (typeof raw === "object") {
    if (Array.isArray(raw?.availability_slots)) {
      return raw.availability_slots;
    }

    if (typeof raw.toJSON === "function") {
      try {
        const parsed = raw.toJSON();
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (_) {
        /* ignore */
      }
    }

    try {
      const parsed = JSON.parse(JSON.stringify(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  return [];
};

const normalizeTime = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const [rawHours, rawMinutes] = trimmed.split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

const normalizeAvailabilitySlotPayload = (slot) => {
  if (!slot || typeof slot !== "object") return null;

  const daysSource = Array.isArray(slot.daysOfWeek)
    ? slot.daysOfWeek
    : slot.days_of_week ?? slot.days ?? slot.dow;

  const daysOfWeek = Array.isArray(daysSource)
    ? Array.from(
        new Set(
          daysSource
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
        )
      ).sort((a, b) => a - b)
    : [];

  const startTime = normalizeTime(slot.startTime ?? slot.start_time);
  const endTime = normalizeTime(slot.endTime ?? slot.end_time);

  if (!daysOfWeek.length || !startTime || !endTime) {
    return null;
  }

  const rawId = slot.id ?? slot.slot_id ?? slot.uuid;
  const id =
    typeof rawId === "string" && uuidPattern.test(rawId)
      ? rawId
      : randomUUID();

  const normalized = {
    id,
    title:
      typeof slot.title === "string" && slot.title.trim()
        ? slot.title.trim()
        : "Available",
    daysOfWeek,
    startTime,
    endTime,
  };

  const startRecur =
    slot.startRecur ?? slot.start_recur ?? slot.startDate ?? slot.start_date;
  if (typeof startRecur === "string" && startRecur.trim()) {
    normalized.startRecur = startRecur.trim();
  }

  const endRecur = slot.endRecur ?? slot.end_recur ?? slot.endDate ?? slot.end_date;
  if (typeof endRecur === "string" && endRecur.trim()) {
    normalized.endRecur = endRecur.trim();
  }

  const backgroundColor = slot.backgroundColor ?? slot.background_color;
  if (typeof backgroundColor === "string" && backgroundColor.trim()) {
    normalized.backgroundColor = backgroundColor.trim();
  }

  const borderColor = slot.borderColor ?? slot.border_color;
  if (typeof borderColor === "string" && borderColor.trim()) {
    normalized.borderColor = borderColor.trim();
  }

  return normalized;
};

const sanitizeAvailabilitySlots = (slots, { strict = true } = {}) => {
  if (!Array.isArray(slots)) {
    return {
      ok: false,
      message: "Availability must be an array.",
    };
  }

  const sanitized = [];

  for (let index = 0; index < slots.length; index += 1) {
    const normalized = normalizeAvailabilitySlotPayload(slots[index]);
    if (!normalized) {
      if (strict) {
        return {
          ok: false,
          message: `Invalid availability slot at index ${index}.`,
          index,
        };
      }
      continue;
    }

    const parsed = availabilitySlotSchema.safeParse(normalized);
    if (!parsed.success) {
      if (strict) {
        const issue = parsed.error.issues?.[0];
        return {
          ok: false,
          message: issue?.message || "Invalid availability slot.",
          issues: parsed.error.issues,
          index,
        };
      }
      continue;
    }

    sanitized.push(parsed.data);
  }

  return { ok: true, value: sanitized };
};

const parseAvailabilitySlots = (raw, { strict = false } = {}) => {
  const rawSlots = extractRawAvailabilitySlots(raw);
  const result = sanitizeAvailabilitySlots(rawSlots, { strict });
  if (!result.ok) {
    return [];
  }
  return result.value;
};

module.exports = {
  sanitizeAvailabilitySlots,
  parseAvailabilitySlots,
};
