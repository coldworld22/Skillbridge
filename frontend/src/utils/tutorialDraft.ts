export interface ChapterDraft {
  title: string;
  duration: string | number;
  video?: string | File | null;
  videoUrl?: string;
  preview: boolean;
  [key: string]: unknown;
}

export interface DraftDefaults {
  language?: string;
  lessonCount?: number;
  chapters?: ChapterDraft[];
  thumbnail?: File | string | null;
  preview?: File | string | null;
  [key: string]: unknown;
}

export interface TutorialDraft extends DraftDefaults {
  title: string;
  shortDescription: string;
  category: string | number;
  categoryName?: string;
  level: string;
  tags: string[];
  chapters: ChapterDraft[];
  thumbnail: File | string | null;
  preview: File | string | null;
  price: string;
  currency: string;
  isFree: boolean;
  status?: string;
  instructorId?: string | number;
}

export const tutorialDraftDefaults: TutorialDraft = {
  title: '',
  shortDescription: '',
  category: '',
  categoryName: '',
  level: '',
  language: '',
  lessonCount: 1,
  tags: [],
  chapters: [],
  thumbnail: null,
  preview: null,
  price: '',
  currency: '',
  isFree: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDraftDefaults(value: unknown): value is DraftDefaults {
  if (!isRecord(value)) {
    return false;
  }

  if (
    'language' in value &&
    value.language !== undefined &&
    typeof value.language !== 'string'
  ) {
    return false;
  }

  if (
    'lessonCount' in value &&
    value.lessonCount !== undefined &&
    typeof value.lessonCount !== 'number'
  ) {
    return false;
  }

  if (
    'chapters' in value &&
    value.chapters !== undefined &&
    !Array.isArray(value.chapters)
  ) {
    return false;
  }

  return true;
}

const emptyDraft: DraftDefaults = {};

export function loadDraft<T extends DraftDefaults>(key: string, defaults: T): T {
  if (typeof window === 'undefined') {
    return { ...defaults };
  }

  const saved = localStorage.getItem(key);
  if (!saved) {
    return { ...defaults };
  }

  try {
    const parsed: unknown = JSON.parse(saved);
    const draft = isDraftDefaults(parsed) ? parsed : emptyDraft;
    const merged: T = { ...defaults };

    Object.assign(merged, draft);

    merged.thumbnail = null;
    merged.preview = null;

    const defaultLanguage =
      typeof defaults.language === 'string' ? defaults.language : undefined;
    const draftLanguage =
      typeof draft.language === 'string' ? draft.language : undefined;
    merged.language = draftLanguage ?? defaultLanguage ?? '';

    const defaultLessonCount =
      typeof defaults.lessonCount === 'number' ? defaults.lessonCount : undefined;
    const draftLessonCount =
      typeof draft.lessonCount === 'number' ? draft.lessonCount : undefined;
    const chapterCount = Array.isArray(draft.chapters)
      ? draft.chapters.length
      : undefined;

    merged.lessonCount =
      draftLessonCount ?? chapterCount ?? defaultLessonCount ?? 1;

    return merged;
  } catch (err) {
    console.error(`Failed to parse ${key}`, err);
    localStorage.removeItem(key);
    return { ...defaults };
  }
}

export function saveDraft<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function hasDataArray(value: unknown): value is { data: unknown[] } {
  if (!isRecord(value)) {
    return false;
  }

  return Array.isArray(value.data);
}

export async function loadCategories(
  fetchFn: () => Promise<unknown>
): Promise<unknown[]> {
  const result = await fetchFn();

  if (hasDataArray(result)) {
    return result.data;
  }

  return Array.isArray(result) ? result : [];
}

export function buildTutorialFormData(
  tutorialData: TutorialDraft,
  status?: string
): FormData {
  const formData = new FormData();
  formData.append('title', tutorialData.title);
  formData.append('description', tutorialData.shortDescription);
  formData.append('category_id', String(tutorialData.category ?? ''));
  formData.append('level', tutorialData.level);
  formData.append('language', tutorialData.language);
  const resolvedStatus = status ?? tutorialData.status ?? '';
  formData.append('status', resolvedStatus);
  formData.append('is_paid', (!tutorialData.isFree).toString());
  if (!tutorialData.isFree) {
    formData.append('price', tutorialData.price);
    if (tutorialData.currency) {
      formData.append('currency', tutorialData.currency);
    }
  }
  if (tutorialData.tags?.length) {
    formData.append('tags', JSON.stringify(tutorialData.tags));
  }
  if (tutorialData.chapters?.length) {
    const chapters = tutorialData.chapters.map((ch, idx) => ({
      title: ch.title,
      duration: ch.duration,
      video_url: ch.videoUrl ?? '',
      order: idx + 1,
      is_preview: ch.preview,
    }));
    formData.append('chapters', JSON.stringify(chapters));
  }
  if (tutorialData.thumbnail instanceof File) {
    formData.append('thumbnail', tutorialData.thumbnail);
  }
  if (tutorialData.preview instanceof File) {
    formData.append('preview', tutorialData.preview);
  }
  return formData;
}
