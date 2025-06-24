import { useEffect, useRef } from "react";

const LocalVideo = ({ stream }) => {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  if (!stream) return null;
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover rounded-lg"
    />
  );
};

const PeerVideo = ({ peer }) => {
  const ref = useRef();
  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className="w-full h-full object-cover rounded-lg"
    />
  );
};

export default function VideoGrid({ localStream, peers }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 w-full h-full">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <LocalVideo stream={localStream} />
      </div>
      {peers.map(({ peerID, peer }) => (
        <div
          key={peerID}
          className="aspect-video bg-black rounded-lg overflow-hidden"
        >
          <PeerVideo peer={peer} />
        </div>
      ))}
    </div>
  );
}
