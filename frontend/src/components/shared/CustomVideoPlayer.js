// src/components/shared/CustomVideoPlayer.js
import { useRef, useState } from "react";

export default function CustomVideoPlayer({ videos = [] }) {
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");
  const videoRef = useRef(null);

  const handleNext = () => {
    if (index < videos.length - 1) {
      setIndex(index + 1);
      setMessage("");
    } else {
      setMessage("This video does not exist in the player.");
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1);
      setMessage("");
    } else {
      setMessage("This video does not exist in the player.");
    }
  };

  const changeSpeed = (delta) => {
    const player = videoRef.current;
    if (player) {
      const newRate = Math.min(4, Math.max(0.25, player.playbackRate + delta));
      player.playbackRate = newRate;
    }
  };

  return (
    <div className="text-center">
      {message && <p className="text-red-500 mb-2">{message}</p>}
      <video
        key={index}
        ref={videoRef}
        controls
        className="mx-auto w-full max-w-2xl rounded bg-black mb-4"
        src={videos[index]?.src}
      />
      <div className="flex justify-center flex-wrap gap-3">
        <button
          onClick={handlePrev}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded"
        >
          Prev
        </button>
        <button
          onClick={() => changeSpeed(-0.25)}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded"
        >
          - Speed
        </button>
        <button
          onClick={() => changeSpeed(0.25)}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded"
        >
          + Speed
        </button>
        <button
          onClick={handleNext}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}
