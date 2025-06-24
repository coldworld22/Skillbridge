import React from "react";

const AudioDeviceSelector = ({
  audioInputDevices = [],
  audioOutputDevices = [],
  selectedAudioInput,
  selectedAudioOutput,
  onSelectInput,
  onSelectOutput,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-1">Microphone</label>
        <select
          value={selectedAudioInput || ""}
          onChange={(e) => onSelectInput && onSelectInput(e.target.value)}
          className="p-2 rounded w-full text-black"
        >
          {audioInputDevices.map((d, idx) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Microphone ${idx + 1}`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Speaker</label>
        <select
          value={selectedAudioOutput || ""}
          onChange={(e) => onSelectOutput && onSelectOutput(e.target.value)}
          className="p-2 rounded w-full text-black"
        >
          {audioOutputDevices.map((d, idx) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Speaker ${idx + 1}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AudioDeviceSelector;
