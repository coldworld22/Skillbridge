// components/tutorials/detail/VideoPlayer.js
const VideoPlayer = ({ videoUrl, onEnded }) => (
    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
      <video
        src={videoUrl}
        controls
        onEnded={onEnded}
        className="w-full h-full object-cover"
      />
    </div>
  );
  
  export default VideoPlayer;
  