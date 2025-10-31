import { useState, useEffect, useMemo } from "react";
import useAuthStore from "@/store/auth/authStore";

const createDefaultProgress = () => ({
  completedChapters: [],
  lastIndex: 0,
  times: {},
});

const normalizeCompletedChapters = (list, chapters) => {
  if (!Array.isArray(list) || !list.length) return [];

  const chapterIds = Array.isArray(chapters)
    ? chapters.map((chapter) => chapter?.id).filter(Boolean)
    : [];

  return Array.from(
    new Set(
      list
        .map((entry) => {
          if (entry == null) return null;
          if (typeof entry === "string" && entry.trim()) return entry;
          if (
            typeof entry === "number" &&
            entry >= 0 &&
            entry < chapterIds.length
          ) {
            return chapterIds[entry];
          }
          if (typeof entry === "object" && entry !== null) {
            if (typeof entry.id === "string" && entry.id.trim()) {
              return entry.id;
            }
            if (
              typeof entry.chapterId === "string" &&
              entry.chapterId.trim()
            ) {
              return entry.chapterId;
            }
          }
          return null;
        })
        .filter(Boolean),
    ),
  );
};

const sanitizeTimes = (times) => {
  if (!times || typeof times !== "object" || Array.isArray(times)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(times)
      .map(([key, value]) => {
        const numeric = Number(value);
        return [key, Number.isFinite(numeric) && numeric >= 0 ? numeric : null];
      })
      .filter(([, value]) => value !== null),
  );
};

const normalizeProgress = (value, chapters) => {
  if (Array.isArray(value)) {
    return normalizeProgress({ completedChapters: value }, chapters);
  }

  if (!value || typeof value !== "object") {
    return createDefaultProgress();
  }

  const rawCompleted = Array.isArray(value.completedChapters)
    ? value.completedChapters
    : Array.isArray(value.completed)
      ? value.completed
      : [];
  const completed = normalizeCompletedChapters(rawCompleted, chapters);

  const lastIndex = Number(value.lastIndex);
  const safeLastIndex = Number.isFinite(lastIndex) ? lastIndex : 0;

  return {
    completedChapters: completed,
    lastIndex: safeLastIndex,
    times: sanitizeTimes(value.times),
  };
};

export default function useTutorialProgress(tutorialId, chapters = []) {
  const userId = useAuthStore((s) => s.user?.id);
  const [progress, setProgress] = useState(createDefaultProgress);

  const storageKey = useMemo(() => {
    if (!tutorialId) return null;
    return `progress-tutorial-${userId ? `${userId}-` : ""}${tutorialId}`;
  }, [tutorialId, userId]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      setProgress(createDefaultProgress());
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const normalized = normalizeProgress(parsed, chapters);
      setProgress(normalized);

      if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        localStorage.setItem(storageKey, JSON.stringify(normalized));
      }
    } catch (err) {
      console.warn("Failed to parse stored tutorial progress; clearing value.", err);
      localStorage.removeItem(storageKey);
      setProgress(createDefaultProgress());
    }
  }, [storageKey, chapters]);

  const persist = (data) => {
    const normalized = normalizeProgress(data, chapters);
    setProgress(normalized);
    if (!storageKey || typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(normalized));
    } catch (err) {
      console.warn("Failed to persist tutorial progress.", err);
    }
  };

  const saveTime = (chapterId, time) => {
    persist({
      ...progress,
      times: { ...progress.times, [chapterId]: time },
    });
  };

  const completeChapter = (index, chapterId) => {
    if (!chapterId && chapterId !== 0) return;
    const updated = Array.from(
      new Set([...progress.completedChapters, chapterId]),
    );
    persist({ ...progress, completedChapters: updated, lastIndex: index });
  };

  const setIndex = (index) => {
    persist({ ...progress, lastIndex: index });
  };

  const startTimeFor = (chapterId) => progress.times?.[chapterId] || 0;

  return { progress, saveTime, completeChapter, setIndex, startTimeFor };
}
