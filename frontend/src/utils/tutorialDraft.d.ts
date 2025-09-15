export interface TutorialChapterDraft {
  id?: number;
  order?: number;
  title: string;
  duration: string | number;
  video?: string | null;
  videoUrl?: string;
  preview: boolean;
}

export interface DraftDefaults extends Record<string, unknown> {
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
  defaults?: DraftDefaults,
  draft?: DraftDefaults
): TutorialDraft;

export function loadDraft(
  key: string,
  defaults?: DraftDefaults
): TutorialDraft;

export function saveDraft(key: string, data: TutorialDraft): void;

export function loadCategories<T>(
  fetchFn: () => Promise<{ data?: T } | T>
): Promise<T | { data?: T } | T[]>;

export function buildTutorialFormData(
  tutorialData: TutorialDraft,
  status?: string
): FormData;
