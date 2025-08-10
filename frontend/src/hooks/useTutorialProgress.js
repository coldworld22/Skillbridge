import { useState, useEffect } from "react";
import useAuthStore from "@/store/auth/authStore";

export default function useTutorialProgress(tutorialId, chapters = []) {
  const userId = useAuthStore((s) => s.user?.id);
  const storageKey = userId
    ? `progress-tutorial-${tutorialId}-${userId}`
    : `progress-tutorial-${tutorialId}`;

  const [progress, setProgress] = useState({
    completedChapters: [], // will now store chapter IDs
    lastIndex: 0,
    times: {},
  });

  useEffect(() => {
    if (!tutorialId) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migration: if old numeric indices are stored, convert to chapter IDs
        if (
          Array.isArray(parsed.completedChapters) &&
          parsed.completedChapters.length > 0 &&
          typeof parsed.completedChapters[0] === "number" &&
          Array.isArray(chapters) &&
          chapters.length
        ) {
          const ids = parsed.completedChapters
            .map((idx) => chapters[idx]?.id)
            .filter(Boolean);
          const migrated = { ...parsed, completedChapters: ids };
          setProgress(migrated);
          localStorage.setItem(storageKey, JSON.stringify(migrated));
        } else {
          setProgress(parsed);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [tutorialId, chapters, storageKey]);

  const persist = (data) => {
    setProgress(data);
    if (tutorialId) {
      localStorage.setItem(storageKey, JSON.stringify(data));
      const total = Array.isArray(chapters) ? chapters.length : 0;
      const percent = total
        ? Math.round((data.completedChapters.length / total) * 100)
        : 0;
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tutorial-progress", {
            detail: { tutorialId, percent },
          }),
        );
      }
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
