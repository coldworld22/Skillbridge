import { useRef, useState, useEffect, useCallback } from "react";
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
import styles from "./CustomVideoPlayer.module.scss";

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
  const resumePositionsRef = useRef({});

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const lastSavedTimesRef = useRef({});
  const isPlayingRef = useRef(false);

  const isBrowser = typeof window !== "undefined";
  const currentVideo = videos[currentIndex]?.src;
  const syncPlayingState = useCallback((value) => {
    isPlayingRef.current = value;
    setIsPlaying(value);
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;
    video.volume = volume;
  }, [volume, currentVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;
    video.muted = isMuted;
  }, [isMuted, currentVideo]);

  const getResumeTime = useCallback(() => {
    const saved = resumePositionsRef.current[currentIndex];
    if (typeof saved === "number" && saved > 0) return saved;
    if (startTime > 0) return startTime;
    return 0;
  }, [currentIndex, startTime]);

  const updateResumePosition = useCallback(
    (index, time) => {
      if (!storageKey || !isBrowser) return;
      const next = { ...resumePositionsRef.current };
      if (!time || Number.isNaN(time) || time <= 0) {
        delete next[index];
      } else {
        next[index] = time;
      }
      resumePositionsRef.current = next;
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
          resumePositionsRef.current = mapped;
        }
      } else {
        resumePositionsRef.current = {};
      }
    } catch (err) {
      console.warn("Failed to restore playback position", err);
    }
  }, [storageKey, isBrowser]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    setError(false);

    const resumeTime = getResumeTime();

    const playIfNeeded = () => {
      if (isPlayingRef.current) {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      }
    };

    const handleResume = () => {
      if (!resumeTime || resumeTime <= 0) {
        setProgress(0);
        return;
      }
      try {
        video.currentTime = resumeTime;
        if (video.duration) {
          setProgress((resumeTime / video.duration) * 100);
        }
      } catch (err) {
        console.warn("Failed to seek to resume time", err);
      }
    };

    video.addEventListener("loadeddata", playIfNeeded);
    if (resumeTime > 0) {
      if (video.readyState >= 1) {
        handleResume();
      } else {
        video.addEventListener("loadedmetadata", handleResume);
      }
    } else {
      setProgress(0);
    }

    video.load();

    return () => {
      video.removeEventListener("loadeddata", playIfNeeded);
      video.removeEventListener("loadedmetadata", handleResume);
    };
  }, [currentVideo, getResumeTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
      syncPlayingState(false);
      if (storageKey) {
        updateResumePosition(currentIndex, 0);
      }
      if (onEnded) onEnded(currentIndex);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [currentVideo, currentIndex, storageKey, onTimeUpdate, onEnded, updateResumePosition, syncPlayingState]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      syncPlayingState(false);
    } else {
      const promise = videoRef.current.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
      syncPlayingState(true);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value);
    if (Number.isNaN(newVolume)) return;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    setIsMuted(newVolume === 0);
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
      syncPlayingState(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      syncPlayingState(false);
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
    syncPlayingState(false);
  };

  const handleRetry = () => {
    const video = videoRef.current;
    if (!video) return;
    setError(false);
    video.load();
    video
      .play()
      .then(() => syncPlayingState(true))
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
    <div ref={playerRef} className={`${styles.player} ${className}`}>
      <video
        key={currentIndex}
        ref={videoRef}
        className={`${styles.video} ${videoClassName}`}
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
        <div className={styles.overlay}>
          <p>Login and enroll to watch full tutorial</p>
        </div>
      )}

      {error && (
        <div className={styles.overlay}>
          <p>Video unavailable</p>
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
            <button onClick={handleRetry} className={styles.speedButton}>
              Retry
            </button>
            {currentVideo && (
              <button onClick={downloadVideo} className={styles.speedButton}>
                Download
              </button>
            )}
          </div>
        </div>
      )}

      <div className={styles.controls}>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleProgressChange}
          className={styles.progress}
          aria-label="Video progress"
          style={{
            background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${progress}%, #4b5563 ${progress}%, #4b5563 100%)`,
          }}
        />

        <div className={styles.row}>
          <div className={styles.actions}>
            <button
              onClick={togglePlay}
              className={styles.iconButton}
              aria-label={isPlaying ? "Pause" : "Play"}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, togglePlay)}
            >
              {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
            </button>

            <button
              onClick={() => skip(-10)}
              className={styles.iconButton}
              aria-label="Skip backward 10 seconds"
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, () => skip(-10))}
            >
              <MdReplay10 size={20} />
            </button>

            <button
              onClick={() => skip(10)}
              className={styles.iconButton}
              aria-label="Skip forward 10 seconds"
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, () => skip(10))}
            >
              <MdForward10 size={20} />
            </button>

            <div className={styles.actions}>
              <button
                onClick={toggleMute}
                className={styles.iconButton}
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
                style={{ width: "5rem" }}
                aria-label="Volume control"
              />
            </div>

            <span className={styles.time}>
              {currentTimeLabel} / {durationLabel}
            </span>
          </div>

          <div className={styles.actions}>
            <button
              onClick={changeSpeed}
              className={styles.speedButton}
              aria-label="Change playback speed"
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, changeSpeed)}
            >
              <MdSpeed size={18} /> <span className={styles.time}>{playbackRate}x</span>
            </button>

            {videos.length > 1 && (
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={styles.iconButton}
                aria-label="Previous video"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, handlePrev)}
                style={currentIndex === 0 ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
              >
                <FaStepBackward size={16} />
              </button>
            )}

            {videos.length > 1 && (
              <button
                onClick={handleNext}
                disabled={currentIndex === videos.length - 1}
                className={styles.iconButton}
                aria-label="Next video"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, handleNext)}
                style={currentIndex === videos.length - 1 ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
              >
                <FaStepForward size={16} />
              </button>
            )}

            <button
              onClick={downloadVideo}
              className={styles.iconButton}
              aria-label="Download video"
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, downloadVideo)}
            >
              <FaDownload size={16} />
            </button>

            <button
              onClick={toggleFullscreen}
              className={styles.iconButton}
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
