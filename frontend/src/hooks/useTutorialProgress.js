import { useState, useEffect, useMemo } from "react";
import useAuthStore from "@/store/auth/authStore";

const createDefaultProgress = () => ({
  completedChapters: [],
  lastIndex: 0,
  times: {},
});

const EMPTY_CHAPTERS = Object.freeze([]);

const getCompletedList = (value) =>
  Array.isArray(value?.completedChapters) ? value.completedChapters : [];

const getTimesMap = (value) =>
  value?.times && typeof value.times === "object" && !Array.isArray(value.times)
    ? value.times
    : {};

const isProgressEmpty = (value) => {
  if (!value) return true;
  const completed = getCompletedList(value);
  const times = getTimesMap(value);
  return (
    completed.length === 0 &&
    (value.lastIndex ?? 0) === 0 &&
    Object.keys(times).length === 0
  );
};

const areProgressEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const aCompleted = getCompletedList(a);
  const bCompleted = getCompletedList(b);
  if (aCompleted.length !== bCompleted.length) return false;
  for (let i = 0; i < aCompleted.length; i += 1) {
    if (aCompleted[i] !== bCompleted[i]) {
      return false;
    }
  }
  if ((a.lastIndex ?? 0) !== (b.lastIndex ?? 0)) {
    return false;
  }
  const aTimes = getTimesMap(a);
  const bTimes = getTimesMap(b);
  const aKeys = Object.keys(aTimes);
  const bKeys = Object.keys(bTimes);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (aTimes[key] !== bTimes[key]) {
      return false;
    }
  }
  return true;
};

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

export default function useTutorialProgress(tutorialId, rawChapters = []) {
  const userId = useAuthStore((s) => s.user?.id);
  const [progress, setProgress] = useState(createDefaultProgress);
  const resolvedChapters =
    Array.isArray(rawChapters) && rawChapters.length ? rawChapters : EMPTY_CHAPTERS;

  const storageKey = useMemo(() => {
    if (!tutorialId) return null;
    return `progress-tutorial-${userId ? `${userId}-` : ""}${tutorialId}`;
  }, [tutorialId, userId]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    let stored = null;
    try {
      stored = localStorage.getItem(storageKey);
    } catch (err) {
      console.warn("Failed to read stored tutorial progress.", err);
    }

    if (!stored) {
      setProgress((prev) =>
        isProgressEmpty(prev) ? prev : createDefaultProgress(),
      );
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const normalized = normalizeProgress(parsed, resolvedChapters);
      setProgress((prev) => (areProgressEqual(prev, normalized) ? prev : normalized));

      const normalizedRaw = JSON.stringify(normalized);
      if (normalizedRaw !== stored) {
        localStorage.setItem(storageKey, normalizedRaw);
      }
    } catch (err) {
      console.warn("Failed to parse stored tutorial progress; clearing value.", err);
      localStorage.removeItem(storageKey);
      setProgress(createDefaultProgress());
    }
  }, [storageKey, resolvedChapters]);

  const persist = (data) => {
    const normalized = normalizeProgress(data, resolvedChapters);
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
