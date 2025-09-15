/**
 * Utility helpers for creating and managing tutorial drafts.
 */

/**
 * @param {Object} [defaults]
 * @param {Object} [draftInput]
 * @returns {Object}
 */
export function createTutorialDraft(defaults = {}, draftInput = {}) {
  const baseDefaults = isPlainObject(defaults) ? defaults : {};
  const draft = isPlainObject(draftInput) ? draftInput : {};
  const combined = { ...baseDefaults, ...draft };

  const thumbnail = resolveFileLike(draft.thumbnail, baseDefaults.thumbnail);
  const preview = resolveFileLike(draft.preview, baseDefaults.preview);
  const language = pickString(draft.language, baseDefaults.language) ?? "";
  const chapters =
    pickChapters(draft.chapters, baseDefaults.chapters) ?? [];
  const defaultLessonCount =
    typeof baseDefaults.lessonCount === "number"
      ? baseDefaults.lessonCount
      : 1;
  const lessonCount =
    typeof draft.lessonCount === "number"
      ? draft.lessonCount
      : chapters.length || defaultLessonCount;

  const tags = pickTags(draft.tags, baseDefaults.tags) ?? [];

  const title = pickString(draft.title, baseDefaults.title) ?? "";
  const shortDescription =
    pickString(
      draft.shortDescription,
      draft.short_description,
      baseDefaults.shortDescription,
      baseDefaults.short_description
    ) ?? "";
  const description = pickString(draft.description, baseDefaults.description);

  const category = pickCategory(draft, baseDefaults);
  const categoryName =
    pickString(
      draft.categoryName,
      draft.category_name,
      baseDefaults.categoryName,
      baseDefaults.category_name
    ) ?? undefined;
  const level = pickString(draft.level, baseDefaults.level) ?? "";
  const status = pickString(draft.status, baseDefaults.status);

  const isFree =
    pickBoolean(
      draft.isFree,
      draft.is_free,
      baseDefaults.isFree,
      baseDefaults.is_free
    ) ?? false;
  const price = pickPrice(draft.price, baseDefaults.price);
  const currency =
    pickString(
      draft.currency,
      draft.currencyCode,
      draft.currency_code,
      baseDefaults.currency,
      baseDefaults.currencyCode,
      baseDefaults.currency_code
    ) ?? undefined;

  const instructorId = pickNumber(
    draft.instructorId,
    draft.instructor_id,
    baseDefaults.instructorId,
    baseDefaults.instructor_id
  );

  return {
    ...combined,
    title,
    shortDescription,
    description,
    category,
    categoryName,
    level,
    language,
    lessonCount,
    chapters,
    thumbnail,
    preview,
    status,
    isFree,
    price,
    currency,
    tags,
    instructorId,
  };
}

/**
 * @param {string} key
 * @param {Object} [defaults]
 * @returns {Object}
 */
export function loadDraft(key, defaults = {}) {
  if (typeof window === "undefined") return createTutorialDraft(defaults);
  const saved = localStorage.getItem(key);
  if (!saved) return createTutorialDraft(defaults);
  try {
    const draft = JSON.parse(saved);
    return createTutorialDraft(defaults, draft);
  } catch (err) {
    console.error(`Failed to parse ${key}`, err);
    localStorage.removeItem(key);
    return createTutorialDraft(defaults);
  }
}

/**
 * @param {string} key
 * @param {Object} data
 */
export function saveDraft(key, data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * @template T
 * @param {() => Promise<T | { data?: T }>} fetchFn
 * @returns {Promise<T | T[] | { [key: string]: any }>}
 */
export async function loadCategories(fetchFn) {
  const result = await fetchFn();
  if (result && typeof result === "object" && "data" in result) {
    return result.data ?? result;
  }
  return result ?? [];
}

/**
 * @param {Object} tutorialData
 * @param {string} [status]
 * @returns {FormData}
 */
export function buildTutorialFormData(tutorialData, status) {
  const formData = new FormData();
  formData.append("title", toStringValue(tutorialData.title, ""));
  formData.append(
    "description",
    toStringValue(tutorialData.shortDescription, "")
  );
  formData.append(
    "category_id",
    toStringValue(tutorialData.category, "")
  );
  formData.append("level", toStringValue(tutorialData.level, ""));
  formData.append("language", toStringValue(tutorialData.language, ""));
  if (status ?? tutorialData.status) {
    formData.append("status", toStringValue(status ?? tutorialData.status, ""));
  }
  formData.append("is_paid", (!tutorialData.isFree).toString());
  if (!tutorialData.isFree && tutorialData.price !== "") {
    formData.append("price", normalizePrice(tutorialData.price, ""));
    if (tutorialData.currency) {
      formData.append("currency", toStringValue(tutorialData.currency, ""));
    }
  }
  if (tutorialData.tags?.length) {
    formData.append("tags", JSON.stringify(tutorialData.tags));
  }
  if (tutorialData.chapters?.length) {
    const chapters = tutorialData.chapters.map((ch, idx) => ({
      title: toStringValue(ch.title, ""),
      duration: ch.duration,
      video_url: ch.videoUrl ?? "",
      order: idx + 1,
      is_preview: !!ch.preview,
    }));
    formData.append("chapters", JSON.stringify(chapters));
  }

  if (isFileInstance(tutorialData.thumbnail)) {
    formData.append("thumbnail", tutorialData.thumbnail);
  }
  if (isFileInstance(tutorialData.preview)) {
    formData.append("preview", tutorialData.preview);
  }

  return formData;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function resolveFileLike(primary, fallback) {
  const candidates = [primary, fallback];
  for (const candidate of candidates) {
    if (isFileInstance(candidate) || typeof candidate === "string") {
      return candidate;
    }
    if (candidate === null) {
      return null;
    }
  }
  return null;
}

function isFileInstance(value) {
  return typeof File !== "undefined" && value instanceof File;
}

function pickString(...values) {
  for (const value of values) {
    if (typeof value === "string") {
      return value;
    }
  }
  return undefined;
}

function pickNumber(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function pickBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
  }
  return undefined;
}

function pickPrice(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value.toString();
    }
    if (typeof value === "string") {
      return value;
    }
  }
  return "";
}

function pickTags(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value
        .map((tag) => {
          if (typeof tag === "string") return tag;
          if (tag && typeof tag === "object" && "name" in tag) {
            const name = tag.name;
            return typeof name === "string" ? name : undefined;
          }
          return undefined;
        })
        .filter((tag) => typeof tag === "string");
    }
  }
  return undefined;
}

function pickChapters(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.map((chapter, index) => normalizeChapter(chapter, index));
    }
  }
  return undefined;
}

function normalizeChapter(input, index) {
  if (!input || typeof input !== "object") {
    return {
      order: index + 1,
      title: "",
      duration: "",
      video: null,
      videoUrl: "",
      preview: false,
    };
  }

  const data = input;
  const durationValue = data.duration;
  const videoValue = data.video;

  const videoUrl =
    typeof data.videoUrl === "string"
      ? data.videoUrl
      : typeof data.video_url === "string"
      ? data.video_url
      : undefined;

  return {
    id: typeof data.id === "number" ? data.id : undefined,
    order:
      typeof data.order === "number"
        ? data.order
        : typeof data.position === "number"
        ? data.position
        : index + 1,
    title: typeof data.title === "string" ? data.title : "",
    duration:
      typeof durationValue === "number" || typeof durationValue === "string"
        ? durationValue
        : "",
    video:
      typeof videoValue === "string"
        ? videoValue
        : videoValue === null
        ? null
        : undefined,
    videoUrl,
    preview:
      typeof data.preview === "boolean"
        ? data.preview
        : typeof data.is_preview === "boolean"
        ? data.is_preview
        : false,
  };
}

function pickCategory(draft = {}, defaults = {}) {
  const values = [
    draft.category,
    draft.categoryId,
    draft.category_id,
    defaults.category,
    defaults.categoryId,
    defaults.category_id,
  ];

  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value.toString();
    }
    if (typeof value === "string") {
      return value;
    }
  }

  return "";
}

function normalizePrice(value, fallback) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : fallback;
  }
  if (typeof value === "string") {
    const cleaned = value.trim();
    if (!cleaned) return fallback;
    const normalized = cleaned.replace(/[^0-9.]/g, "");
    return normalized || fallback;
  }
  return fallback;
}

function toStringValue(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}
