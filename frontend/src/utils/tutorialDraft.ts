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

export function loadDraft(
  key: string,
  defaults: TutorialDraftDefaults = {}
): TutorialDraftDefaults {
  if (typeof window === 'undefined') return { ...defaults };
  const saved = localStorage.getItem(key);
  if (!saved) return { ...defaults };
  try {
    const draft = JSON.parse(saved) as TutorialDraftDefaults;
    return {
      ...defaults,
      ...draft,
      thumbnail: null,
      preview: null,
      language: draft?.language ?? defaults.language ?? '',
      lessonCount:
        draft?.lessonCount ??
        draft?.chapters?.length ??
        defaults.lessonCount ??
        1,
    };
  } catch (err) {
    console.error(`Failed to parse ${key}`, err);
    localStorage.removeItem(key);
    return { ...defaults };
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
