import { useRef, useState } from "react";

// components/tutorials/detail/VideoPlayer.js
const VideoPlayer = ({ videoUrl, onEnded }) => {
  const [error, setError] = useState(false);
  const videoRef = useRef(null);

  const handleRetry = () => {
    const video = videoRef.current;
    if (!video) return;
    setError(false);
    video.load();
    video.play().catch(() => {});
  };

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
      {error ? (
        <div className="flex flex-col items-center justify-center w-full h-full text-white p-4">
          <p>Video unavailable</p>
          <div className="mt-2 space-x-2">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-yellow-500 rounded"
            >
              Retry
            </button>
            {videoUrl && (
              <a
                href={videoUrl}
                download
                className="px-4 py-2 bg-gray-700 rounded"
              >
                Download
              </a>
            )}
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          onEnded={onEnded}
          onError={() => setError(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default VideoPlayer;

