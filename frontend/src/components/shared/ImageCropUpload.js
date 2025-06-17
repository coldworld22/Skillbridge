// components/shared/ImageCropUpload.jsx
import React, { useState } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import { Slider } from "@/components/ui/slider";

export default function ImageCropUpload({ value, onChange }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [preview, setPreview] = useState(value);

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const dataUrl = reader.result;
        setImageSrc(dataUrl);
        setPreview(dataUrl);
        onChange(dataUrl); // prefill with original image in case cropping is skipped
      };
    }
  };

  const onCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCrop = async () => {
    const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
    setPreview(croppedImage);
    onChange(croppedImage);
    setImageSrc(null);
  };

  return (
    <div className="space-y-3">
      {preview && (
        <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded border" />
      )}

      <input type="file" accept="image/*" onChange={onFileChange} />

      {imageSrc && (
        <div className="relative w-full h-64 bg-gray-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 10}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
          <div className="mt-2">
            <Slider min={1} max={3} step={0.1} value={[zoom]} onValueChange={([z]) => setZoom(z)} />
          </div>
          <button
            type="button"
            onClick={handleCrop}
            className="mt-3 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Crop & Save
          </button>
        </div>
      )}
    </div>
  );
}