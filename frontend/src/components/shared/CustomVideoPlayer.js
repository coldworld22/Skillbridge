import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaVolumeUp,
  FaVolumeMute,
  FaDownload,
  FaExpand,
} from "react-icons/fa";
import { MdSpeed, MdReplay10, MdForward10 } from "react-icons/md";

export default function CustomVideoPlayer({
  videos = [],
  startTime = 0,
  onTimeUpdate,
  onEnded,
  locked = false,
  className = "",
  videoClassName = "",
  storageKey,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(false);
  const [resumePositions, setResumePositions] = useState({});

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const lastSavedTimesRef = useRef({});

  const isBrowser = typeof window !== "undefined";
  const currentVideo = videos[currentIndex]?.src;

  const getResumeTime = useMemo(() => {
    const saved = resumePositions[currentIndex];
    if (typeof saved === "number" && saved > 0) return saved;
    if (startTime > 0) return startTime;
    return 0;
  }, [currentIndex, resumePositions, startTime]);

  const updateResumePosition = useCallback(
    (index, time) => {
      if (!storageKey || !isBrowser) return;
      setResumePositions((prev) => {
        const next = { ...prev };
        if (!time || Number.isNaN(time) || time <= 0) {
          delete next[index];
        } else {
          next[index] = time;
        }
        try {
          const sanitized = Object.fromEntries(
            Object.entries(next).filter(
              ([, value]) => typeof value === "number" && value > 0
            )
          );
          if (Object.keys(sanitized).length === 0) {
            localStorage.removeItem(storageKey);
          } else {
            localStorage.setItem(storageKey, JSON.stringify(sanitized));
          }
        } catch (err) {
          console.warn("Failed to persist playback position", err);
        }
        return next;
      });
      lastSavedTimesRef.current[index] = time;
    },
    [storageKey, isBrowser]
  );

  useEffect(() => {
    if (!storageKey || !isBrowser) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const mapped = Object.fromEntries(
            Object.entries(parsed)
              .map(([key, value]) => [Number(key), Number(value)])
              .filter(([, value]) => !Number.isNaN(value) && value > 0)
          );
          setResumePositions(mapped);
        }
      }
    } catch (err) {
      console.warn("Failed to restore playback position", err);
    }
  }, [storageKey, isBrowser]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playIfNeeded = () => {
      if (isPlaying) {
        const p = video.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => {});
        }
      }
    };

    video.addEventListener("loadeddata", playIfNeeded);
    video.load();
    setProgress(0);

    const initialTime = getResumeTime;
    if (initialTime > 0) {
      const seek = () => {
        video.currentTime = initialTime;
        if (video.duration) {
          setProgress((initialTime / video.duration) * 100);
        }
      };
      if (video.readyState >= 1) {
        seek();
      } else {
        video.addEventListener("loadedmetadata", seek, { once: true });
      }
    }

    return () => {
      video.removeEventListener("loadeddata", playIfNeeded);
    };
  }, [currentVideo, isPlaying, getResumeTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      const resumeTime = getResumeTime;
      if (resumeTime > 0 && video.duration) {
        video.currentTime = resumeTime;
        setProgress((resumeTime / video.duration) * 100);
      }
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const current = video.currentTime;
      setProgress((current / video.duration) * 100);
      if (onTimeUpdate) {
        onTimeUpdate(current, currentIndex);
      }
      if (storageKey) {
        const lastSaved = lastSavedTimesRef.current[currentIndex] || 0;
        if (Math.abs(lastSaved - current) >= 1) {
          updateResumePosition(currentIndex, current);
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (storageKey) {
        updateResumePosition(currentIndex, 0);
      }
      if (onEnded) onEnded(currentIndex);
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [currentVideo, getResumeTime, currentIndex, storageKey, onTimeUpdate, onEnded, updateResumePosition]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying((prev) => !prev);
  };

  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted((prev) => !prev);
  };

  const handleProgressChange = (e) => {
    if (!videoRef.current || !videoRef.current.duration) return;
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    videoRef.current.currentTime =
      (newProgress / 100) * videoRef.current.duration;
  };

  const changeSpeed = () => {
    if (!videoRef.current) return;
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(playbackRate);
    const nextIndex = (idx + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    videoRef.current.playbackRate = newSpeed;
    setPlaybackRate(newSpeed);
  };

  const skip = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const handleKeyDown = (event, action) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(false);
    }
  };

  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch((err) => {
        console.error(`Failed to enter fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const downloadVideo = async () => {
    if (!currentVideo || !isBrowser) return;
    try {
      const res = await fetch(currentVideo, { credentials: "include" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const ext = currentVideo.split(".").pop().split(/[?#]/)[0] || "mp4";
      const link = document.createElement("a");
      link.href = url;
      link.download = `video-${currentIndex + 1}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download video", err);
    }
  };

  const handleError = () => {
    setError(true);
    setIsPlaying(false);
  };

  const handleRetry = () => {
    const video = videoRef.current;
    if (!video) return;
    setError(false);
    video.load();
    video
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {});
  };

  const formatTimestamp = (time = 0) => {
    if (!Number.isFinite(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const currentTimeLabel = videoRef.current
    ? formatTimestamp(videoRef.current.currentTime)
    : "0:00";
  const durationLabel = videoRef.current
    ? formatTimestamp(videoRef.current.duration)
    : "0:00";

  return (
    <div
      ref={playerRef}
      className={`relative bg-black rounded-lg border-2 border-yellow-500 overflow-hidden shadow-lg ${className}`}
    >
      <video
        key={currentIndex}
        ref={videoRef}
        className={`w-full ${videoClassName}`}
        src={currentVideo}
        onClick={togglePlay}
        tabIndex={0}
        onKeyDown={(e) => handleKeyDown(e, togglePlay)}
        aria-label="Video player"
        autoPlay={isPlaying}
        muted={isMuted}
        preload="metadata"
        crossOrigin="anonymous"
        onError={handleError}
      />

      {locked && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-center p-4">
          <p>Login and enroll to watch full tutorial</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center p-4">
          <p>Video unavailable</p>
          <div className="mt-2 space-x-2">
            <button onClick={handleRetry} className="px-4 py-2 bg-yellow-500 rounded">
              Retry
            </button>
            {currentVideo && (
              <button onClick={downloadVideo} className="px-4 py-2 bg-gray-700 rounded">
                Download
              </button>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleProgressChange}
          className="w-full h-1.5 mb-3 appearance-none bg-gray-600 rounded-full cursor-pointer"
          aria-label="Video progress"
          style={{
            background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${progress}%, #4b5563 ${progress}%, #4b5563 100%)`,
          }}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlay}
              className="text-white hover:text-yellow-400 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, togglePlay)}
            >
              {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
            </button>

            <button
              onClick={() => skip(-10)}
              className="text-white hover:text-yellow-400 transition-colors"
              aria-label="Skip backward 10 seconds"
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, () => skip(-10))}
            >
              <MdReplay10 size={20} />
            </button>

            <button
              onClick={() => skip(10)}
              className="text-white hover:text-yellow-400 transition-colors"
              aria-label="Skip forward 10 seconds"
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, () => skip(10))}
            >
              <MdForward10 size={20} />
            </button>

            <div className="flex items-center">
              <button
                onClick={toggleMute}
                className="text-white hover:text-yellow-400 transition-colors mr-1"
                aria-label={isMuted ? "Unmute" : "Mute"}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, toggleMute)}
              >
                {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1.5 appearance-none bg-gray-600 rounded-full cursor-pointer"
                aria-label="Volume control"
              />
            </div>

            <span className="text-white text-sm ml-2">
              {currentTimeLabel} / {durationLabel}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={changeSpeed}
              className="text-white hover:text-yellow-400 transition-colors flex items-center"
              aria-label="Change playback speed"
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, changeSpeed)}
            >
              <MdSpeed size={18} className="mr-1" />
              <span className="text-sm">{playbackRate}x</span>
            </button>

            {videos.length > 1 && (
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`text-white hover:text-yellow-400 transition-colors ${
                  currentIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                aria-label="Previous video"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, handlePrev)}
              >
                <FaStepBackward size={16} />
              </button>
            )}

            {videos.length > 1 && (
              <button
                onClick={handleNext}
                disabled={currentIndex === videos.length - 1}
                className={`text-white hover:text-yellow-400 transition-colors ${
                  currentIndex === videos.length - 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                aria-label="Next video"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, handleNext)}
              >
                <FaStepForward size={16} />
              </button>
            )}

            <button
              onClick={downloadVideo}
              className="text-white hover:text-yellow-400 transition-colors"
              aria-label="Download video"
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, downloadVideo)}
            >
              <FaDownload size={16} />
            </button>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-yellow-400 transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, toggleFullscreen)}
            >
              <FaExpand size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
