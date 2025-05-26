import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import { FaUpload, FaTimesCircle, FaCrop, FaCheck } from "react-icons/fa";

const PersonalDetails = ({ formData, setFormData, nextStep }) => {
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(formData.profilePicture || "");
  const [file, setFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
      setFile(file);
      setShowCropper(true);
    }
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(preview, croppedAreaPixels);
      setPreview(croppedImage);
      setFormData({ ...formData, profilePicture: croppedImage });
      setShowCropper(false);
    } catch (error) {
      console.error("Crop Error:", error);
    }
  };

  const removeImage = () => {
    setPreview("");
    setFormData({ ...formData, profilePicture: "" });
  };

  const validateAndNext = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Full name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep(); // ✅ only proceed if all fields are valid
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6 text-gray-800">Personal Details</h2>

      {/* Profile Picture Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
        <div className="flex flex-col items-center">
          {preview && !showCropper ? (
            <div className="relative">
              <img
                src={preview}
                alt="Profile Preview"
                className="w-24 h-24 rounded-full border-4 border-yellow-500 shadow-md"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
              >
                <FaTimesCircle size={14} />
              </button>
              <button
                onClick={() => setShowCropper(true)}
                className="mt-3 px-3 py-1 bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg hover:bg-yellow-600 transition flex items-center gap-2"
              >
                <FaCrop /> Crop Image
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center w-40 h-24 border-2 border-dashed border-yellow-400 rounded-lg text-yellow-600 hover:bg-yellow-50 transition">
              <FaUpload size={20} />
              <span className="text-sm mt-1">Upload Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>
      </div>

      {/* Cropper */}
      {showCropper && (
        <div className="relative w-full h-72 bg-black rounded-md overflow-hidden mb-6">
          <Cropper
            image={preview}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
            <button
              onClick={handleCropSave}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
            >
              <FaCheck /> Save Crop
            </button>
          </div>
        </div>
      )}

      {/* Full Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 mt-1 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-yellow-500 focus:border-yellow-500"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 mt-1 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-yellow-500 focus:border-yellow-500"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 mt-1 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-yellow-500 focus:border-yellow-500"
        />
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>

      {/* Button */}
      <button
        className="w-full py-3 mt-4 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition"
        onClick={validateAndNext}
      >
        Next
      </button>
    </div>
  );
};

export default PersonalDetails;
