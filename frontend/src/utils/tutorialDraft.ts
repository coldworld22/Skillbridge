export interface TutorialChapterDraft {
  id?: number;
  order?: number;
  title: string;
  duration: string | number;
  video?: string | null;
  videoUrl?: string;
  preview: boolean;
}
interface TutorialDraftDefaults extends DraftDefaults {
  thumbnail?: File | string | null;
  preview?: File | string | null;
}

export interface TutorialDraftDefaults extends DraftDefaults {
  thumbnail: File | string | null;
  preview: File | string | null;
  language: string;
  lessonCount: number;
}

function createTutorialDraft(
  defaults: DraftDefaults = {},
  draft?: DraftDefaults
): TutorialDraftDefaults {
  const defaultThumbnail =
    (defaults.thumbnail as File | string | null | undefined) ?? null;
  const defaultPreview =
    (defaults.preview as File | string | null | undefined) ?? null;
  const defaultLanguage =
    typeof defaults.language === 'string' ? defaults.language : '';
  const defaultLessonCount =
    typeof defaults.lessonCount === 'number' ? defaults.lessonCount : 1;

  const draftThumbnail =
    (draft?.thumbnail as File | string | null | undefined) ?? defaultThumbnail;
  const draftPreview =
    (draft?.preview as File | string | null | undefined) ?? defaultPreview;
  const draftLanguage =
    typeof draft?.language === 'string' ? draft.language : undefined;
  const draftChaptersLength =
    draft && Array.isArray(draft.chapters)
      ? (draft.chapters as unknown[]).length
      : undefined;
  const draftLessonCount =
    typeof draft?.lessonCount === 'number'
      ? draft.lessonCount
      : draftChaptersLength;

  return {
    ...defaults,
    ...draft,
    thumbnail: draftThumbnail,
    preview: draftPreview,
    language: draftLanguage ?? defaultLanguage,
    lessonCount: draftLessonCount ?? defaultLessonCount,
  };
}

export function loadDraft(
  key: string,
  defaults: DraftDefaults = {}
): TutorialDraftDefaults {
  if (typeof window === 'undefined') return createTutorialDraft(defaults);
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

export function saveDraft(key: string, data: TutorialDraftDefaults): void {
  if (typeof window === 'undefined') return;
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
