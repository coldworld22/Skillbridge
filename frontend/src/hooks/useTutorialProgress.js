import { useState, useEffect } from "react";

export default function useTutorialProgress(tutorialId) {
  const [progress, setProgress] = useState({
    completedChapters: [],
    lastIndex: 0,
    times: {},
  });

  useEffect(() => {
    if (!tutorialId) return;
    const stored = localStorage.getItem(`progress-tutorial-${tutorialId}`);
    if (stored) {
      try {
        setProgress(JSON.parse(stored));
      } catch {
        // ignore parse errors
      }
    }
  }, [tutorialId]);

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
    const updated = Array.from(new Set([...progress.completedChapters, index]));
    persist({ ...progress, completedChapters: updated, lastIndex: index });
  };

  const setIndex = (index) => {
    persist({ ...progress, lastIndex: index });
  };

  const startTimeFor = (chapterId) => progress.times?.[chapterId] || 0;

  return { progress, saveTime, completeChapter, setIndex, startTimeFor };
}
