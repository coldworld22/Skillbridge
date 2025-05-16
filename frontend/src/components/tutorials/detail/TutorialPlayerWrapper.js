// ✅ 2. TutorialPlayerWrapper.js
import { useEffect, useState } from "react";
import TutorialPlayer from "./TutorialPlayer";
import ChapterList from "./ChapterList";

const chaptersData = [
  {
    title: "Intro to React",
    duration: "4",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    title: "JSX and Components",
    duration: "8",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
  },
  {
    title: "Hooks Deep Dive",
    duration: "5",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
];

const TutorialPlayerWrapper = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState([]);

  const tutorialId = "react-basic";

  // Load completed chapters from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`completed-${tutorialId}`) || "[]");
    setCompleted(saved);
  }, []);

  const handleComplete = () => {
    if (!completed.includes(currentIndex)) {
      const updated = [...completed, currentIndex];
      setCompleted(updated);
      localStorage.setItem(`completed-${tutorialId}`, JSON.stringify(updated));
    }

    if (currentIndex + 1 < chaptersData.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const allCompleted = completed.length === chaptersData.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <TutorialPlayer
          video={chaptersData[currentIndex].videoUrl}
          tutorialId={`tutorial-${currentIndex}`}
          chapters={chaptersData}
          onComplete={handleComplete}
          isRestricted={false} // pass this as true if access is limited
        />

        {allCompleted && (
          <div className="bg-green-900 p-4 mt-6 text-center rounded-lg text-yellow-300 animate-pulse">
            \ud83c\udf89 Congratulations! You've completed all chapters and unlocked your certificate!
          </div>
        )}
      </div>

      <div className="md:col-span-1">
        <ChapterList
          chapters={chaptersData}
          currentIndex={currentIndex}
          completedChapters={completed}
          onSelect={(index) => setCurrentIndex(index)}
        />
      </div>
    </div>
  );
};

export default TutorialPlayerWrapper;