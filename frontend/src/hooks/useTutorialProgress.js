import { useState, useEffect, useCallback } from "react";
import useAuthStore from "@/store/auth/authStore";

export default function useTutorialProgress(tutorialId, chapters = []) {
  const userId = useAuthStore((s) => s.user?.id);
  const [progress, setProgress] = useState({
    completedChapters: [], // will now store chapter IDs
    lastIndex: 0,
    times: {},
  });

  useEffect(() => {
    if (!tutorialId) return;
    const key = `progress-tutorial-${userId ? `${userId}-` : ""}${tutorialId}`;
    const stored = localStorage.getItem(key);
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
          localStorage.setItem(key, JSON.stringify(migrated));
        } else {
          setProgress(parsed);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [tutorialId, chapters, userId]);

  const persist = useCallback(
    (data) => {
      setProgress(data);
      if (tutorialId) {
        const key = `progress-tutorial-${
          userId ? `${userId}-` : ""
        }${tutorialId}`;
        localStorage.setItem(key, JSON.stringify(data));
      }
    },
    [tutorialId, userId]
  );

  const saveTime = useCallback(
    (chapterId, time) => {
      persist({
        ...progress,
        times: { ...progress.times, [chapterId]: time },
      });
    },
    [persist, progress]
  );

  const completeChapter = useCallback(
    (index, chapterId) => {
      if (!chapterId && chapterId !== 0) return;
      const updated = Array.from(
        new Set([...progress.completedChapters, chapterId])
      );
      persist({ ...progress, completedChapters: updated, lastIndex: index });
    },
    [persist, progress]
  );

  const setIndex = useCallback(
    (index) => {
      persist({ ...progress, lastIndex: index });
    },
    [persist, progress]
  );

  const startTimeFor = useCallback(
    (chapterId) => progress.times?.[chapterId] || 0,
    [progress.times]
  );

  return { progress, saveTime, completeChapter, setIndex, startTimeFor };
}
