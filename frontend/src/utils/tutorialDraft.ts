interface TutorialChapterDraft {
  id?: number | string;
  title: string;
  duration: string | number;
  video?: File | string | null;
  videoUrl?: string | null;
  preview?: boolean;
  [key: string]: unknown;
}

export interface TutorialDraft {
  title: string;
  shortDescription: string;
  category: string | number;
  categoryName?: string;
  level: string;
  language: string;
  lessonCount: number | string;
  tags: string[];
  chapters?: TutorialChapterDraft[];
  thumbnail: File | string | null;
  preview: File | string | null;
  price?: string | number;
  currency?: string;
  isFree: boolean;
  status?: string;
  instructorId?: number | string;
  [key: string]: unknown;
}

type DraftDefaults = Partial<TutorialDraft>;

type TutorialDraftDefaults = DraftDefaults & {
  language: string;
  lessonCount: number | string;
  thumbnail: File | string | null;
  preview: File | string | null;
};

export function loadDraft(
  key: string,
  defaults: DraftDefaults = {}
): TutorialDraftDefaults {
  if (typeof window === 'undefined') {
    return { ...defaults } as TutorialDraftDefaults;
  }

  const saved = localStorage.getItem(key);
  if (!saved) {
    return { ...defaults } as TutorialDraftDefaults;
  }

  try {
    const draft = JSON.parse(saved) as DraftDefaults;
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
    } as TutorialDraftDefaults;
  } catch (err) {
    console.error(`Failed to parse ${key}`, err);
    localStorage.removeItem(key);
    return { ...defaults } as TutorialDraftDefaults;
  }
}

export function saveDraft(key: string, data: TutorialDraft): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

type Category = Record<string, unknown>;

interface CategoryResponse {
  data?: Category[] | CategoryResponse | null;
  [key: string]: unknown;
}

type CategoryFetchResult = Category[] | CategoryResponse | null | undefined;

function isCategoryResponse(value: unknown): value is CategoryResponse {
  return Boolean(value) && typeof value === 'object' && 'data' in (value as object);
}

function extractCategories(result: CategoryFetchResult): Category[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (isCategoryResponse(result)) {
    const { data } = result;

    if (Array.isArray(data)) {
      return data;
    }

    if (isCategoryResponse(data)) {
      return extractCategories(data);
    }
  }

  return [];
}

export async function loadCategories(
  fetchFn: () => Promise<CategoryFetchResult>
): Promise<Category[]> {
  const result = await fetchFn();
  return extractCategories(result);
}

export function buildTutorialFormData(
  tutorialData: TutorialDraft,
  status?: string
) {
  const formData = new FormData();
  formData.append('title', tutorialData.title);
  formData.append('description', tutorialData.shortDescription);
  formData.append('category_id', String(tutorialData.category));
  formData.append('level', tutorialData.level);
  formData.append('language', tutorialData.language);

  const resolvedStatus = status ?? tutorialData.status;
  if (resolvedStatus) {
    formData.append('status', resolvedStatus);
  }

  formData.append('is_paid', (!tutorialData.isFree).toString());

  if (!tutorialData.isFree) {
    if (tutorialData.price !== undefined && tutorialData.price !== null) {
      formData.append('price', String(tutorialData.price));
    }
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
