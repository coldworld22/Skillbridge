import { useState, useRef } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

const videos = [
  { src: "/videos/tutorials/default-preview.mp4", title: "Preview Video 1" },
  { src: "/videos/tutorials/default-preview.mp4", title: "Preview Video 2" },
];

export default function VideoPlayerDemo() {
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
    <div className="bg-gray-900 text-white min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 py-8 text-center">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">Demo Video Player</h1>
        {message && <p className="text-red-500 mb-4">{message}</p>}
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
      <Footer />
    </div>
  );
}
