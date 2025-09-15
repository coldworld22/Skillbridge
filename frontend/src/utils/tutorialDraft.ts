export interface TutorialChapterDraft {
  id?: number;
  order?: number;
  title: string;
  duration: string | number;
  video?: string | null;
  videoUrl?: string;
  preview: boolean;
}

export interface TutorialDraft {
  title: string;
  shortDescription: string;
  category: string | number;
  categoryName: string;
  level: string;
  language: string;
  lessonCount: number;
  tags: string[];
  chapters: TutorialChapterDraft[];
  thumbnail: File | string | null;
  preview: File | string | null;
  price: string | number;
  currency: string;
  isFree: boolean;
  status?: string;
  instructorId?: number | string;
}

export const DEFAULT_TUTORIAL_DRAFT: TutorialDraft = {
  title: "",
  shortDescription: "",
  category: "",
  categoryName: "",
  level: "",
  language: "",
  lessonCount: 1,
  tags: [],
  chapters: [],
  thumbnail: null,
  preview: null,
  price: "",
  currency: "",
  isFree: false,
};

type DraftInput = Partial<TutorialDraft> & Record<string, unknown>;

const cloneDraft = (draft: TutorialDraft): TutorialDraft => ({
  ...draft,
  tags: [...draft.tags],
  chapters: cloneChapters(draft.chapters),
});

const cloneChapters = (
  chapters: TutorialChapterDraft[]
): TutorialChapterDraft[] => chapters.map((chapter) => ({ ...chapter }));

const toStringValue = (value: unknown, fallback: string): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && !Number.isNaN(value)) {
    return String(value);
  }
  return fallback;
};

const normalizePrice = (value: unknown, fallback: string | number): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value.toString();
  }
  return typeof fallback === "number" ? fallback.toString() : fallback;
};

const normalizeMedia = (
  value: unknown,
  fallback: File | string | null
): File | string | null => {
  if (typeof value === "string") return value;
  if (typeof File !== "undefined" && value instanceof File) return value;
  return fallback;
};

const normalizeTags = (value: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(value)) return [...fallback];
  const tags: string[] = [];
  value.forEach((tag) => {
    if (typeof tag === "string") {
      tags.push(tag);
    } else if (tag && typeof tag === "object" && typeof tag.name === "string") {
      tags.push(tag.name);
    }
  });
  return tags;
};

const normalizeChapter = (chapter: unknown): TutorialChapterDraft => {
  if (!chapter || typeof chapter !== "object") {
    return { title: "", duration: "", video: null, videoUrl: "", preview: false };
  }

  const data = chapter as Partial<TutorialChapterDraft> & Record<string, unknown>;
  const rawVideoUrl =
    typeof data.videoUrl === "string"
      ? data.videoUrl
      : typeof data.video_url === "string"
      ? data.video_url
      : "";
  const durationValue =
    typeof data.duration === "number" || typeof data.duration === "string"
      ? data.duration
      : "";

  return {
    id: typeof data.id === "number" ? data.id : undefined,
    order: typeof data.order === "number" ? data.order : undefined,
    title: typeof data.title === "string" ? data.title : "",
    duration: durationValue,
    video:
      typeof data.video === "string"
        ? data.video
        : rawVideoUrl
        ? rawVideoUrl
        : null,
    videoUrl: rawVideoUrl || undefined,
    preview:
      typeof data.preview === "boolean"
        ? data.preview
        : typeof data.is_preview === "boolean"
        ? data.is_preview
        : false,
  };
};

const normalizeChapters = (
  value: unknown,
  fallback: TutorialChapterDraft[]
): TutorialChapterDraft[] => {
  if (!Array.isArray(value)) return cloneChapters(fallback);
  return value.map((chapter) => normalizeChapter(chapter));
};

const normalizeLessonCount = (
  value: unknown,
  chapters: TutorialChapterDraft[],
  fallback: number
): number => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  if (chapters.length > 0) {
    return chapters.length;
  }
  return fallback > 0 ? fallback : 1;
};

const mergeDraft = (data: DraftInput = {}, defaults?: TutorialDraft): TutorialDraft => {
  const base = cloneDraft(defaults ?? DEFAULT_TUTORIAL_DRAFT);

  const tags = normalizeTags(data.tags ?? (data as { keywords?: unknown }).keywords, base.tags);
  const chapters = normalizeChapters(
    data.chapters ?? (data as { lessons?: unknown }).lessons,
    base.chapters
  );

  const lessonCount = normalizeLessonCount(
    data.lessonCount ?? (data as { lesson_count?: unknown }).lesson_count ?? (data as { lessons_count?: unknown }).lessons_count,
    chapters,
    base.lessonCount
  );

  const language = toStringValue((data as { language?: unknown; locale?: unknown }).language ?? (data as { locale?: unknown }).locale, base.language);

  const categoryRaw =
    data.category ??
    (data as { categoryId?: unknown }).categoryId ??
    (data as { category_id?: unknown }).category_id;

  const categoryName = toStringValue(
    data.categoryName ?? (data as { category_name?: unknown }).category_name ?? base.categoryName,
    base.categoryName
  );

  const status =
    typeof data.status === "string"
      ? data.status
      : typeof (data as { moderation_status?: unknown }).moderation_status === "string"
      ? ((data as { moderation_status: string }).moderation_status as string)
      : base.status;

  const instructorIdValue =
    data.instructorId ?? (data as { instructor_id?: unknown }).instructor_id;

  return {
    ...base,
    title: typeof data.title === "string" ? data.title : base.title,
    shortDescription: toStringValue(
      data.shortDescription ?? (data as { description?: unknown }).description ?? base.shortDescription,
      base.shortDescription
    ),
    category: categoryRaw !== undefined ? toStringValue(categoryRaw, base.category as string) : base.category,
    categoryName,
    level: toStringValue(data.level ?? base.level, base.level),
    language,
    lessonCount,
    tags,
    chapters,
    thumbnail: normalizeMedia(
      data.thumbnail ?? (data as { thumbnail_url?: unknown }).thumbnail_url ?? (data as { cover_image?: unknown }).cover_image,
      base.thumbnail
    ),
    preview: normalizeMedia(
      data.preview ?? (data as { preview_video?: unknown }).preview_video,
      base.preview
    ),
    price: normalizePrice(data.price ?? (data as { cost?: unknown }).cost, base.price),
    currency: toStringValue(
      data.currency ?? (data as { currency_code?: unknown }).currency_code ?? base.currency,
      base.currency
    ),
    isFree:
      typeof data.isFree === "boolean"
        ? data.isFree
        : typeof (data as { is_paid?: unknown }).is_paid === "boolean"
        ? !(data as { is_paid: boolean }).is_paid
        : base.isFree,
    status,
    instructorId:
      typeof instructorIdValue === "number" || typeof instructorIdValue === "string"
        ? instructorIdValue
        : base.instructorId,
  };
};

export const createTutorialDraft = (
  data: DraftInput = {},
  defaults?: TutorialDraft
): TutorialDraft => mergeDraft(data, defaults);

export function loadDraft(key: string, defaults?: TutorialDraft): TutorialDraft | null {
  if (typeof window === "undefined") {
    return defaults ? createTutorialDraft({}, defaults) : null;
  }
  const saved = localStorage.getItem(key);
  if (!saved) {
    return defaults ? createTutorialDraft({}, defaults) : null;
  }
  try {
    const parsed = JSON.parse(saved) as DraftInput;
    return mergeDraft(parsed, defaults);
  } catch (err) {
    console.error(`Failed to parse ${key}`, err);
    localStorage.removeItem(key);
    return defaults ? createTutorialDraft({}, defaults) : null;
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
  formData.append("description", toStringValue(tutorialData.shortDescription, ""));
  formData.append("category_id", toStringValue(tutorialData.category, ""));
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
