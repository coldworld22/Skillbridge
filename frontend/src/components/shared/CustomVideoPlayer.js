import { useRef, useState, useEffect } from "react";
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaVolumeUp, FaVolumeMute, FaDownload, FaExpand } from "react-icons/fa";
import { MdSpeed, MdReplay10, MdForward10 } from "react-icons/md";

export default function CustomVideoPlayer({ videos = [], startTime = 0, onTimeUpdate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  const currentVideo = videos[currentIndex]?.src;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      if (startTime > 0) {
        video.currentTime = startTime;
        setProgress((startTime / video.duration) * 100);
      }
    };

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime, currentIndex);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentVideo, startTime, onTimeUpdate]);

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgressChange = (e) => {
    const newProgress = e.target.value;
    setProgress(newProgress);
    videoRef.current.currentTime = (newProgress / 100) * videoRef.current.duration;
  };

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    videoRef.current.playbackRate = newSpeed;
    setPlaybackRate(newSpeed);
  };

  const skip = (seconds) => {
    videoRef.current.currentTime += seconds;
  };

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
      videoRef.current.play();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
      videoRef.current.play();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const downloadVideo = () => {
    if (!currentVideo) return;
    const link = document.createElement('a');
    link.href = currentVideo;
    link.download = `video-${currentIndex + 1}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      ref={playerRef}
      className="relative bg-black rounded-lg border-2 border-yellow-500 overflow-hidden shadow-lg"
    >
      <video
        key={currentIndex}
        ref={videoRef}
        className="w-full"
        src={currentVideo}
        onClick={togglePlay}
        autoPlay={isPlaying}
        muted={isMuted}
      />

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleProgressChange}
          className="w-full h-1.5 mb-3 appearance-none bg-gray-600 rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${progress}%, #4b5563 ${progress}%, #4b5563 100%)`
          }}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-yellow-400 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
            </button>

            {/* Skip Backward */}
            <button
              onClick={() => skip(-10)}
              className="text-white hover:text-yellow-400 transition-colors"
              aria-label="Skip backward 10 seconds"
            >
              <MdReplay10 size={20} />
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skip(10)}
              className="text-white hover:text-yellow-400 transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <MdForward10 size={20} />
            </button>

            {/* Volume Control */}
            <div className="flex items-center">
              <button
                onClick={toggleMute}
                className="text-white hover:text-yellow-400 transition-colors mr-1"
                aria-label={isMuted ? "Unmute" : "Mute"}
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
              />
            </div>

            {/* Current Time */}
            <span className="text-white text-sm ml-2">
              {videoRef.current ? 
                `${Math.floor(videoRef.current.currentTime / 60)}:${Math.floor(videoRef.current.currentTime % 60).toString().padStart(2, '0')}` : 
                "0:00"
              } / {videoRef.current ? 
                `${Math.floor(videoRef.current.duration / 60)}:${Math.floor(videoRef.current.duration % 60).toString().padStart(2, '0')}` : 
                "0:00"
              }
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Playback Speed */}
            <button
              onClick={changeSpeed}
              className="text-white hover:text-yellow-400 transition-colors flex items-center"
              aria-label="Change playback speed"
            >
              <MdSpeed size={18} className="mr-1" />
              <span className="text-sm">{playbackRate}x</span>
            </button>

            {/* Previous Video */}
            {videos.length > 1 && (
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`text-white hover:text-yellow-400 transition-colors ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Previous video"
              >
                <FaStepBackward size={16} />
              </button>
            )}

            {/* Next Video */}
            {videos.length > 1 && (
              <button
                onClick={handleNext}
                disabled={currentIndex === videos.length - 1}
                className={`text-white hover:text-yellow-400 transition-colors ${currentIndex === videos.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Next video"
              >
                <FaStepForward size={16} />
              </button>
            )}

            {/* Download */}
            <button
              onClick={downloadVideo}
              className="text-white hover:text-yellow-400 transition-colors"
              aria-label="Download video"
            >
              <FaDownload size={16} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-yellow-400 transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <FaExpand size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}