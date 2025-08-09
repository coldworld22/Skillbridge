import { useState, useEffect } from "react";

export default function useTutorialProgress(tutorialId, chapters = []) {
  const [progress, setProgress] = useState({
    completedChapters: [], // will now store chapter IDs
    lastIndex: 0,
    times: {},
  });

  useEffect(() => {
    if (!tutorialId) return;
    const stored = localStorage.getItem(`progress-tutorial-${tutorialId}`);
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
          localStorage.setItem(
            `progress-tutorial-${tutorialId}`,
            JSON.stringify(migrated),
          );
        } else {
          setProgress(parsed);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [tutorialId, chapters]);

  const persist = (data) => {
    setProgress(data);
    if (tutorialId) {
      localStorage.setItem(
        `progress-tutorial-${tutorialId}`,
        JSON.stringify(data),
      );
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
