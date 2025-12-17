// components/ui/slider.js
import * as React from "react";
import styles from "./Slider.module.scss";

export function Slider({ min = 1, max = 3, step = 0.1, value, onValueChange }) {
  const handleChange = (e) => {
    onValueChange([parseFloat(e.target.value)]);
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={handleChange}
      className={styles.slider}
    />
  );
}
