/**
 * @typedef {Object} TutorialChapterDraft
 * @property {number=} id
 * @property {number=} order
 * @property {string} title
 * @property {string|number} duration
 * @property {string|null=} video
 * @property {string=} videoUrl
 * @property {boolean} preview
 */

/**
 * @typedef {Object} DraftDefaults
 * @property {number=} id
 * @property {string=} title
 * @property {string=} shortDescription
 * @property {string=} short_description
 * @property {string=} description
 * @property {string|number=} category
 * @property {string|number=} categoryId
 * @property {string|number=} category_id
 * @property {string=} categoryName
 * @property {string=} category_name
 * @property {string=} level
 * @property {string=} language
 * @property {number=} lessonCount
 * @property {unknown[]=} chapters
 * @property {File|string|null=} thumbnail
 * @property {File|string|null=} preview
 * @property {string=} status
 * @property {boolean=} isFree
 * @property {boolean=} is_free
 * @property {string|number=} price
 * @property {string=} currency
 * @property {string=} currencyCode
 * @property {string=} currency_code
 * @property {unknown[]=} tags
 * @property {number=} instructorId
 * @property {number=} instructor_id
 */

/**
 * @typedef {Object} TutorialDraft
 * @property {number=} id
 * @property {string} title
 * @property {string} shortDescription
 * @property {string=} description
 * @property {string} category
 * @property {string=} categoryName
 * @property {string} level
 * @property {string} language
 * @property {number} lessonCount
 * @property {TutorialChapterDraft[]} chapters
 * @property {File|string|null} thumbnail
 * @property {File|string|null} preview
 * @property {string=} status
 * @property {boolean} isFree
 * @property {string} price
 * @property {string=} currency
 * @property {string[]} tags
 * @property {number=} instructorId
 */

/**
 * @param {DraftDefaults} [defaults]
 * @param {DraftDefaults} [draft]
 * @returns {TutorialDraft}
 */
export function createTutorialDraft(defaults = {}, draft) {
  const combined = { ...defaults, ...draft };

  const thumbnail = resolveFileLike(draft?.thumbnail, defaults.thumbnail);
  const preview = resolveFileLike(draft?.preview, defaults.preview);
  const language = pickString(draft?.language, defaults.language) ?? "";
  const chapters = pickChapters(draft?.chapters, defaults.chapters) ?? [];
  const defaultLessonCount =
    typeof defaults.lessonCount === "number" ? defaults.lessonCount : 1;
  const lessonCount =
    typeof draft?.lessonCount === "number"
      ? draft.lessonCount
      : chapters.length || defaultLessonCount;

  const tags = pickTags(draft?.tags, defaults.tags) ?? [];

  const title = pickString(draft?.title, defaults.title) ?? "";
  const shortDescription =
    pickString(
      draft?.shortDescription,
      draft?.short_description,
      defaults.shortDescription,
      defaults.short_description
    ) ?? "";
  const description = pickString(draft?.description, defaults.description);

  const category = pickCategory(draft, defaults);
  const categoryName =
    pickString(
      draft?.categoryName,
      draft?.category_name,
      defaults.categoryName,
      defaults.category_name
    ) ?? undefined;
  const level = pickString(draft?.level, defaults.level) ?? "";
  const status = pickString(draft?.status, defaults.status);

  const isFree =
    pickBoolean(
      draft?.isFree,
      draft?.is_free,
      defaults.isFree,
      defaults.is_free
    ) ?? false;
  const price = pickPrice(draft?.price, defaults.price);
  const currency =
    pickString(
      draft?.currency,
      draft?.currencyCode,
      draft?.currency_code,
      defaults.currency,
      defaults.currencyCode,
      defaults.currency_code
    ) ?? undefined;

  const instructorId = pickNumber(
    draft?.instructorId,
    draft?.instructor_id,
    defaults.instructorId,
    defaults.instructor_id
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
 * @param {DraftDefaults} [defaults]
 * @returns {TutorialDraft}
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
 * @param {TutorialDraft} data
 * @returns {void}
 */
export function saveDraft(key, data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * @template T
 * @param {() => Promise<{ data?: T } | T>} fetchFn
 * @returns {Promise<T | { data?: T } | T[]>}
 */
export async function loadCategories(fetchFn) {
  const result = await fetchFn();
  if (result && typeof result === "object" && "data" in result) {
    return result.data ?? [];
  }
  return result ?? [];
}

/**
 * @param {TutorialDraft} tutorialData
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
  if (tutorialData.tags.length) {
    formData.append("tags", JSON.stringify(tutorialData.tags));
  }
  if (tutorialData.chapters.length) {
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
  const data = /** @type {{ [key: string]: any }} */ (input);
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
