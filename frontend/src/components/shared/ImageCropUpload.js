// components/shared/ImageCropUpload.jsx
import React, { useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import { Slider } from "@/components/ui/slider";
import styles from "./ImageCropUpload.module.scss";

export default function ImageCropUpload({ value = null, onChange }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [preview, setPreview] = useState(value);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const dataUrl = reader.result;
        setImageSrc(dataUrl);
        setPreview(dataUrl);
        onChange(file); // prefill with original image in case cropping is skipped
      };
    }
  };

  const onCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCrop = async () => {
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    const url = URL.createObjectURL(blob);
    setPreview(url);
    onChange(blob);
    setImageSrc(null);
  };

  return (
    <div className={styles.wrapper}>
      {preview && (
        <img src={preview} alt="Preview" className={styles.preview} />
      )}

      <input type="file" accept="image/*" onChange={onFileChange} className={styles.input} />

      {imageSrc && (
        <div className={styles.cropper}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 10}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
          <div className={styles.controls}>
            <Slider min={1} max={3} step={0.1} value={[zoom]} onValueChange={([z]) => setZoom(z)} />
          </div>
          <button
            type="button"
            onClick={handleCrop}
            className={styles.button}
          >
            Crop & Save
          </button>
        </div>
      )}
    </div>
  );
}
