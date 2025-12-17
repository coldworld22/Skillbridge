import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const VideoCallScreen = dynamic(
  () => import("@/components/video-call/VideoCallScreen"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-yellow-300">
        Preparing your call…
      </div>
    ),
  },
);

const VideoCallPage = () => {
  const router = useRouter();
  const { roomId } = router.query; // use shared room identifier
  if (!roomId) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center">
      <VideoCallScreen chatId={roomId} />
    </div>
  );
};

export default VideoCallPage;
