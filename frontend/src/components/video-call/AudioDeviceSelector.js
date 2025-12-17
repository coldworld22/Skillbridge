import React from "react";
import styles from "./AudioDeviceSelector.module.scss";

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
    <div className={styles.container}>
      <div className={styles.field}>
        <label className={styles.label}>Camera</label>
        {videoInputDevices.length > 0 ? (
          <select
            value={selectedVideoInput || ""}
            onChange={(e) => onSelectVideo && onSelectVideo(e.target.value)}
            className={styles.select}
          >
            {videoInputDevices.map((d, idx) => (
              <option key={d.deviceId || idx} value={d.deviceId}>
                {d.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        ) : (
          <p className={styles.helper}>No camera devices detected</p>
        )}
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Microphone</label>
        {audioInputDevices.length > 0 ? (
          <select
            value={selectedAudioInput || ""}
            onChange={(e) => onSelectInput && onSelectInput(e.target.value)}
            className={styles.select}
          >
            {audioInputDevices.map((d, idx) => (
              <option key={d.deviceId || idx} value={d.deviceId}>
                {d.label || `Microphone ${idx + 1}`}
              </option>
            ))}
          </select>
        ) : (
          <p className={styles.helper}>No microphone devices detected</p>
        )}
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Speaker</label>
        {audioOutputDevices.length > 0 ? (
          <select
            value={selectedAudioOutput || ""}
            onChange={(e) => onSelectOutput && onSelectOutput(e.target.value)}
            className={styles.select}
          >
            {audioOutputDevices.map((d, idx) => (
              <option key={d.deviceId || idx} value={d.deviceId}>
                {d.label || `Speaker ${idx + 1}`}
              </option>
            ))}
          </select>
        ) : (
          <p className={styles.helper}>No speaker devices detected</p>
        )}
      </div>
    </div>
  );
};

export default AudioDeviceSelector;
