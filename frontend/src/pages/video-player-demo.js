import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import CustomVideoPlayer from "@/components/shared/CustomVideoPlayer";
const videos = [
  { src: "/videos/tutorials/default-preview.mp4", title: "Preview Video 1" },
  { src: "/videos/tutorials/default-preview.mp4", title: "Preview Video 2" },
];

export default function VideoPlayerDemo() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 py-8 text-center">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">Demo Video Player</h1>

        <CustomVideoPlayer videos={videos} />

      </div>
      <Footer />
    </div>
  );
}
