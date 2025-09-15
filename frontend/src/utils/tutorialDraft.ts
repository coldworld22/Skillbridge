export interface TutorialChapterDraft {
  id?: number;
  order?: number;
  title: string;
  duration: string | number;
  video?: string | null;
  videoUrl?: string;
  preview: boolean;
}

interface DraftDefaults extends Record<string, unknown> {
  id?: number;
  title?: string;
  shortDescription?: string;
  short_description?: string;
  description?: string;
  category?: string | number;
  categoryId?: string | number;
  category_id?: string | number;
  categoryName?: string;
  category_name?: string;
  level?: string;
  language?: string;
  lessonCount?: number;
  chapters?: unknown[];
  thumbnail?: File | string | null;
  preview?: File | string | null;
  status?: string;
  isFree?: boolean;
  is_free?: boolean;
  price?: string | number;
  currency?: string;
  currencyCode?: string;
  currency_code?: string;
  tags?: unknown[];
  instructorId?: number;
  instructor_id?: number;
}

export interface TutorialDraft extends Record<string, unknown> {
  id?: number;
  title: string;
  shortDescription: string;
  description?: string;
  category: string;
  categoryName?: string;
  level: string;
  language: string;
  lessonCount: number;
  chapters: TutorialChapterDraft[];
  thumbnail: File | string | null;
  preview: File | string | null;
  status?: string;
  isFree: boolean;
  price: string;
  currency?: string;
  tags: string[];
  instructorId?: number;
}

export function createTutorialDraft(
  defaults: DraftDefaults = {},
  draft?: DraftDefaults
): TutorialDraft {
  const combined: DraftDefaults = { ...defaults, ...draft };

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

export function loadDraft(
  key: string,
  defaults: DraftDefaults = {}
): TutorialDraft {
  if (typeof window === "undefined") return createTutorialDraft(defaults);
  const saved = localStorage.getItem(key);
  if (!saved) return createTutorialDraft(defaults);
  try {
    const draft = JSON.parse(saved) as DraftDefaults;
    return createTutorialDraft(defaults, draft);
  } catch (err) {
    console.error(`Failed to parse ${key}`, err);
    localStorage.removeItem(key);
    return createTutorialDraft(defaults);
  }
}

export function saveDraft(key: string, data: TutorialDraft): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export async function loadCategories<T>(
  fetchFn: () => Promise<{ data?: T } | T>
): Promise<T | { data?: T } | T[]> {
  const result = await fetchFn();
  return (result as { data?: T })?.data || (result as T) || [];
}

export function buildTutorialFormData(
  tutorialData: TutorialDraft,
  status?: string
): FormData {
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

  if (tutorialData.thumbnail instanceof File) {
    formData.append("thumbnail", tutorialData.thumbnail);
  }
  if (tutorialData.preview instanceof File) {
    formData.append("preview", tutorialData.preview);
  }

  return formData;
}

function resolveFileLike(
  primary?: File | string | null,
  fallback?: File | string | null
): File | string | null {
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

function isFileInstance(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string") {
      return value;
    }
  }
  return undefined;
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function pickBoolean(...values: unknown[]): boolean | undefined {
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

function pickPrice(...values: unknown[]): string {
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

function pickTags(
  ...values: (unknown[] | undefined)[]
): string[] | undefined {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value
        .map((tag) => {
          if (typeof tag === "string") return tag;
          if (tag && typeof tag === "object" && "name" in tag) {
            const name = (tag as Record<string, unknown>).name;
            return typeof name === "string" ? name : undefined;
          }
          return undefined;
        })
        .filter((tag): tag is string => typeof tag === "string");
    }
  }
  return undefined;
}

function pickChapters(
  ...values: (unknown[] | undefined)[]
): TutorialChapterDraft[] | undefined {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.map((chapter, index) => normalizeChapter(chapter, index));
    }
  }
  return undefined;
}

function normalizeChapter(
  input: unknown,
  index: number
): TutorialChapterDraft {
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

  const data = input as Record<string, unknown>;
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

function pickCategory(
  draft?: DraftDefaults,
  defaults?: DraftDefaults
): string {
  const values = [
    draft?.category,
    draft?.categoryId,
    draft?.category_id,
    defaults?.category,
    defaults?.categoryId,
    defaults?.category_id,
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

function normalizePrice(value: unknown, fallback: string): string {
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

function toStringValue(value: unknown, fallback: string): string {
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
