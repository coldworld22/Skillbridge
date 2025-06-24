// File: pages/dashboard/instructor/online-classes/create.js

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { FaTrash, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import InstructorLayout from '@/components/layouts/InstructorLayout';
import withAuthProtection from '@/hooks/withAuthProtection';

import { fetchAllCategories } from '@/services/instructor/categoryService';
import { createInstructorClass, fetchInstructorClasses } from '@/services/instructor/classService';
import { fetchClassTags, createClassTag } from '@/services/instructor/classTagService';
import useAuthStore from '@/store/auth/authStore';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

const loaderStyle = "mt-2 text-sm text-blue-600 flex items-center gap-2 animate-pulse";
const slugify = (text) => text.toLowerCase().trim().replace(/[^\w ]+/g, '').replace(/ +/g, '-');

function CreateOnlineClass() {
  const [formData, setFormData] = useState({
    image: '', imagePreview: '',
    demoVideo: null, demoPreview: ''
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const router = useRouter();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageUploading(true);
      setUploadProgress(0);
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: file, imagePreview: reader.result }));
        setImageUploading(false);
        setUploadProgress(100);
      };
      reader.onerror = () => {
        toast.error("Failed to load image preview.");
        setImageUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoUploading(true);
      setUploadProgress(0);
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, demoVideo: file, demoPreview: URL.createObjectURL(file) }));
        setVideoUploading(false);
        setUploadProgress(100);
      };
      reader.onerror = () => {
        toast.error("Failed to load video preview.");
        setVideoUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <InstructorLayout>
      <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
        <h1 className="text-xl font-bold mb-4">🎓 Create New Class (Instructor)</h1>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block mb-1 text-sm text-gray-600">Upload Cover Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {imageUploading && (
            <>
              <div className={loaderStyle}><FaSpinner className="animate-spin" />Uploading image preview...</div>
              <div className="w-full bg-gray-200 h-2 rounded mt-1">
                <div
                  className="bg-blue-500 h-full rounded"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </>
          )}
          {formData.imagePreview && !imageUploading && (
            <img src={formData.imagePreview} alt="Preview" className="mt-2 w-full sm:w-40 h-auto rounded shadow" />
          )}
        </div>

        {/* Video Upload */}
        <div className="mb-6">
          <label className="block mb-1 text-sm text-gray-600">Upload Demo Video</label>
          <input type="file" accept="video/*" onChange={handleVideoUpload} />
          {videoUploading && (
            <>
              <div className={loaderStyle}><FaSpinner className="animate-spin" />Uploading video preview... {uploadProgress}%</div>
              <div className="w-full bg-gray-200 h-2 rounded mt-1">
                <div
                  className="bg-green-500 h-full rounded"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </>
          )}
          {formData.demoPreview && !videoUploading && (
            <video src={formData.demoPreview} controls className="mt-2 w-full max-h-[300px] rounded" />
          )}
        </div>
      </div>
    </InstructorLayout>
  );
}

export default withAuthProtection(CreateOnlineClass, ['instructor']);