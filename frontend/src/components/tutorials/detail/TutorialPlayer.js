import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  Play,
  Pause,
  Maximize,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw
} from "lucide-react";

const TutorialPlayer = ({
  video,
  tutorialId = "default",
  nextId,
  prevId,
  chapters = [],
  onComplete,
}) => {
  const videoRef = useRef(null);
  const router = useRouter();

  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const savedTime = localStorage.getItem(`progress-${tutorialId}`);
    if (videoRef.current && savedTime) {
      videoRef.current.currentTime = parseFloat(savedTime);
    }
  }, [tutorialId]);

  useEffect(() => {
    if (progress >= 98 && typeof onComplete === "function") {
      onComplete();
    }
  }, [progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current) {
        localStorage.setItem(`progress-${tutorialId}`, videoRef.current.currentTime);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [tutorialId]);

  const handleTimeUpdate = () => {
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    setProgress((current / total) * 100);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleNext = () => {
    if (nextId) router.push(`/tutorials/${nextId}`);
  };

  const handlePrev = () => {
    if (prevId) router.push(`/tutorials/${prevId}`);
  };

  const increaseVolume = () => {
    if (videoRef.current) {
      const newVolume = Math.min(1, videoRef.current.volume + 0.1);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setMuted(false);
    }
  };

  const decreaseVolume = () => {
    if (videoRef.current) {
      const newVolume = Math.max(0, videoRef.current.volume - 0.1);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl mb-8 p-5 backdrop-blur-sm">
      {/* Video */}
      <div className="relative rounded-xl overflow-hidden border-2 border-yellow-500">
        <video
          key={video}
          ref={videoRef}
          src={video}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setProgress(0)}
          className="w-full h-auto rounded-md"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-between items-center mt-5 gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={handlePrev} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-all duration-150 shadow"><SkipBack size={20} /></button>
          <button onClick={() => skip(-10)} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-all duration-150 shadow"><RotateCcw size={20} /></button>
          <button onClick={togglePlay} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-all duration-150 shadow">{isPlaying ? <Pause size={20} /> : <Play size={20} />}</button>
          <button onClick={() => skip(10)} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-all duration-150 shadow"><RotateCw size={20} /></button>
          <button onClick={handleNext} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-all duration-150 shadow"><SkipForward size={20} /></button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-white">
          <select
            value={speed}
            onChange={(e) => {
              const newSpeed = Number(e.target.value);
              setSpeed(newSpeed);
              if (videoRef.current) videoRef.current.playbackRate = newSpeed;
            }}
            className="bg-gray-700 text-white text-sm px-2 py-1 rounded"
          >
            {[0.5, 1, 1.25, 1.5, 2].map(rate => (
              <option key={rate} value={rate}>{rate}x</option>
            ))}
          </select>

          <button onClick={() => videoRef.current?.requestFullscreen()} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-all duration-150 shadow"><Maximize size={20} /></button>
          <button onClick={decreaseVolume} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-all duration-150 shadow" title="Volume Down">🔉</button>
          <button onClick={toggleMute} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-all duration-150 shadow" title="Mute / Unmute">{muted ? "🔇" : "🔊"}</button>
          <button onClick={increaseVolume} className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-all duration-150 shadow" title="Volume Up">🔊</button>

          {/* Volume display */}
          <div className="text-yellow-300 min-w-[50px] text-right">{Math.round(volume * 100)}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-5">
        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden relative">
          <div className="h-3 bg-yellow-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />

          {/* Chapter Bookmarks */}
          {chapters.length > 0 && videoRef.current?.duration &&
            chapters.reduce((acc, chapter, index) => {
              const min = parseInt(chapter.duration);
              const startTime = acc.lastTime;
              const width = (min * 60 / videoRef.current.duration) * 100;
              acc.lastTime += min * 60;
              acc.elements.push(
                <div
                  key={index}
                  className="absolute top-0 h-3 bg-yellow-300 opacity-50"
                  style={{
                    left: `${(startTime / videoRef.current.duration) * 100}%`,
                    width: `${width}%`,
                  }}
                  title={chapter.title}
                />
              );
              return acc;
            }, { lastTime: 0, elements: [] }).elements}
        </div>
        <p className="text-sm text-yellow-400 text-right mt-1">{Math.round(progress)}% Watched</p>
      </div>
    </div>
  );
};

export default TutorialPlayer;