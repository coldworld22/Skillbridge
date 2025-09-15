interface DraftDefaults {
  language?: string;
  lessonCount?: number;
  chapters?: unknown[];
  [key: string]: unknown;
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

export async function loadCategories(fetchFn) {
  const result = await fetchFn();
  return result?.data || result || [];
}

export function buildTutorialFormData(tutorialData, status) {
  const formData = new FormData();
  formData.append('title', tutorialData.title);
  formData.append('description', tutorialData.shortDescription);
  formData.append('category_id', tutorialData.category);
  formData.append('level', tutorialData.level);
  formData.append('language', tutorialData.language);
  formData.append('status', status ?? tutorialData.status);
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
      video_url: ch.videoUrl,
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
