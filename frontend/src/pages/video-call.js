import { useRouter } from "next/router";
import VideoCallScreen from "@/components/video-call/VideoCallScreen";

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
