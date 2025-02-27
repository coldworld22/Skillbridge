const VideoGrid = ({ chatId }) => {
  return (
    <div className="relative h-full w-full flex flex-wrap gap-4 p-4">
      {[1, 2, 3, 4].map((user, index) => (
        <VideoTile key={index} user={user} />
      ))}
    </div>
  );
};

/* 🛠️ Utility Component for Reusable Video Tiles */
const VideoTile = ({ user }) => (
  <div className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4 h-56 bg-gray-700 rounded-lg shadow-lg flex items-center justify-center">
    <span className="text-gray-400">User {user}</span>
  </div>
);

export default VideoGrid;
