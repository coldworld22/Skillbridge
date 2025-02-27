import { useRouter } from "next/router";
import VideoCallScreen from "@/components/video-call/VideoCallScreen";

const VideoCallPage = () => {
  const router = useRouter();
  const { chatId } = router.query; // ✅ Get chatId from URL

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center">
      <VideoCallScreen chatId={chatId} />
    </div>
  );
};

export default VideoCallPage;
