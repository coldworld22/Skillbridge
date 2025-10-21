import React from "react";

const AudioDeviceSelector = ({
  audioInputDevices = [],
  audioOutputDevices = [],
  videoInputDevices = [],
  selectedAudioInput,
  selectedAudioOutput,
  selectedVideoInput,
  onSelectInput,
  onSelectOutput,
  onSelectVideo,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-1">Camera</label>
        {videoInputDevices.length > 0 ? (
          <select
            value={selectedVideoInput || ""}
            onChange={(e) => onSelectVideo && onSelectVideo(e.target.value)}
            className="p-2 rounded w-full text-black"
          >
            {videoInputDevices.map((d, idx) => (
              <option key={d.deviceId || idx} value={d.deviceId}>
                {d.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-gray-300">No camera devices detected</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Microphone</label>
        {audioInputDevices.length > 0 ? (
          <select
            value={selectedAudioInput || ""}
            onChange={(e) => onSelectInput && onSelectInput(e.target.value)}
            className="p-2 rounded w-full text-black"
          >
            {audioInputDevices.map((d, idx) => (
              <option key={d.deviceId || idx} value={d.deviceId}>
                {d.label || `Microphone ${idx + 1}`}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-gray-300">No microphone devices detected</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Speaker</label>
        {audioOutputDevices.length > 0 ? (
          <select
            value={selectedAudioOutput || ""}
            onChange={(e) => onSelectOutput && onSelectOutput(e.target.value)}
            className="p-2 rounded w-full text-black"
          >
            {audioOutputDevices.map((d, idx) => (
              <option key={d.deviceId || idx} value={d.deviceId}>
                {d.label || `Speaker ${idx + 1}`}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-gray-300">No speaker devices detected</p>
        )}
      </div>
    </div>
  );
};

export default AudioDeviceSelector;
